from pathlib import Path
from typing import Optional

import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sklearn.ensemble import RandomForestRegressor

USAGE_COLUMNS = ["Usage_M1", "Usage_M2", "Usage_M3", "Usage_M4", "Usage_M5", "Usage_M6"]


class PredictResponse(BaseModel):
    predicted_demand: float
    reorder_point: float
    suggestion: str
    expiry_message: str | None = None


class ModelService:
    def __init__(self) -> None:
        self.model: Optional[RandomForestRegressor] = None
        self.known_medicines: set[str] = set()
        self.medicine_meta: dict[str, dict[str, float]] = {}

    @staticmethod
    def _is_expiring_within_days(expiry_value: str, days: int = 30) -> bool:
        if not expiry_value:
            return False
        today = pd.Timestamp.now().normalize()
        expiry = pd.to_datetime(expiry_value, errors="coerce")
        if pd.isna(expiry):
            return False
        delta_days = (expiry.normalize() - today).days
        return 0 <= delta_days <= days

    @staticmethod
    def _load_raw_dataset() -> pd.DataFrame:
        dataset_path = Path(__file__).resolve().parent.parent / "dataset.csv"
        if not dataset_path.exists():
            raise FileNotFoundError(f"dataset.csv not found at {dataset_path}")
        return pd.read_csv(dataset_path)

    @staticmethod
    def _preprocess(raw_df: pd.DataFrame) -> pd.DataFrame:
        long_df = raw_df[["Medicine", *USAGE_COLUMNS]].melt(
            id_vars=["Medicine"],
            value_vars=USAGE_COLUMNS,
            var_name="month",
            value_name="units_sold",
        )
        long_df["month"] = long_df["month"].str.extract(r"M(\d+)").astype(int)
        long_df = long_df.sort_values(["Medicine", "month"]).reset_index(drop=True)
        long_df = long_df.rename(columns={"Medicine": "medicine"})

        long_df["last_month_usage"] = long_df.groupby("medicine")["units_sold"].shift(1)
        long_df["last_2_month_usage"] = long_df.groupby("medicine")["units_sold"].shift(2)

        processed_df = long_df.dropna(
            subset=["last_month_usage", "last_2_month_usage"]
        ).reset_index(drop=True)

        processed_df["last_month_usage"] = processed_df["last_month_usage"].astype(int)
        processed_df["last_2_month_usage"] = processed_df["last_2_month_usage"].astype(int)
        return processed_df

    def train_on_startup(self) -> None:
        raw_df = self._load_raw_dataset()
        raw_df["Medicine"] = raw_df["Medicine"].astype(str).str.strip()
        self.known_medicines = set(raw_df["Medicine"].dropna())
        meta_df = (
            raw_df.sort_values(["Medicine", "Expiry_Date"])
            .groupby("Medicine", as_index=False)[["Lead_Time", "Safety_Stock", "Expiry_Date"]]
            .first()
        )
        self.medicine_meta = meta_df.set_index("Medicine").to_dict(orient="index")
        processed_df = self._preprocess(raw_df)

        X = processed_df[["month", "last_month_usage", "last_2_month_usage"]]
        y = processed_df["units_sold"]

        self.model = RandomForestRegressor(n_estimators=200, random_state=42)
        self.model.fit(X, y)

    def predict(
        self,
        medicine: str,
        month: int,
        last_month_usage: int,
        last_2_month_usage: int,
        current_stock: int,
    ) -> dict[str, float | str]:
        if self.model is None:
            raise RuntimeError("Model is not trained yet.")

        medicine_name = medicine.strip()
        if medicine_name not in self.known_medicines:
            raise HTTPException(status_code=404, detail=f"Unknown medicine: {medicine}")

        feature_frame = pd.DataFrame(
            [
                {
                    "month": month,
                    "last_month_usage": last_month_usage,
                    "last_2_month_usage": last_2_month_usage,
                }
            ]
        )
        predicted_demand = float(self.model.predict(feature_frame)[0])

        medicine_details = self.medicine_meta.get(medicine_name)
        if medicine_details is None:
            raise HTTPException(status_code=404, detail=f"Metadata not found for medicine: {medicine}")

        lead_time = float(medicine_details["Lead_Time"])
        safety_stock = float(medicine_details["Safety_Stock"])
        expiry_message = None

        if self._is_expiring_within_days(str(medicine_details.get("Expiry_Date", "")), days=30):
            # Expiry-aware adjustment to avoid overestimating future usage for near-expiry batches.
            predicted_demand = predicted_demand * 0.85
            expiry_message = "Risk of Expiry – prioritize usage"

        reorder_point = (predicted_demand * lead_time) + safety_stock
        suggestion = "Reorder Immediately" if current_stock <= reorder_point else "Stock is sufficient"

        return {
            "predicted_demand": round(predicted_demand, 2),
            "reorder_point": round(reorder_point, 2),
            "suggestion": suggestion,
            "expiry_message": expiry_message,
        }


service = ModelService()
app = FastAPI(title="Demand Prediction API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event() -> None:
    service.train_on_startup()


@app.get("/predict", response_model=PredictResponse)
def predict(
    medicine: str = Query(..., description="Medicine name"),
    last_month_usage: int = Query(..., ge=0),
    last_2_month_usage: int = Query(..., ge=0),
    month: int = Query(..., ge=1, le=12),
    current_stock: int = Query(..., ge=0),
) -> PredictResponse:
    prediction_result = service.predict(
        medicine=medicine,
        month=month,
        last_month_usage=last_month_usage,
        last_2_month_usage=last_2_month_usage,
        current_stock=current_stock,
    )
    return PredictResponse(**prediction_result)

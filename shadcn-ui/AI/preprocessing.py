import pandas as pd
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sentence_transformers import SentenceTransformer
import torch

class MedicalDataPreprocessor:
    def __init__(self):
        self.text_encoder = SentenceTransformer('pritamdeka/BioBERT-mnli-snli-scinli-scitail-mednli-stsb')
        self.vital_scaler = StandardScaler()
        self.label_encoder = LabelEncoder()
        
    def process_vitals(self, df: pd.DataFrame) -> pd.DataFrame:
        vital_columns = [
            'heart_rate', 'respiratory_rate', 'blood_pressure_systolic',
            'blood_pressure_diastolic', 'temperature', 'oxygen_saturation'
        ]
        return pd.DataFrame(
            self.vital_scaler.fit_transform(df[vital_columns]),
            columns=vital_columns
        )
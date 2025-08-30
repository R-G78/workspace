import pandas as pd
import torch
from typing import List
from sentence_transformers import SentenceTransformer

class MedicalFeatureEngine:
    def __init__(self):
        self.embedder = SentenceTransformer('pritamdeka/BioBERT-mnli-snli-scinli-scitail-mednli-stsb')
        
    def create_features(self, 
                       clinical_notes: List[str], 
                       vitals: pd.DataFrame,
                       labs: pd.DataFrame) -> torch.Tensor:
        # Create text embeddings
        note_embeddings = self.embedder.encode(clinical_notes)
        
        # Process vitals
        vital_features = self.process_vitals(vitals)
        
        # Process lab results
        lab_features = self.process_labs(labs)
        
        # Combine all features
        return torch.cat([
            torch.tensor(note_embeddings),
            torch.tensor(vital_features.values),
            torch.tensor(lab_features.values)
        ], dim=1)
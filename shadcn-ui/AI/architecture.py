import torch
import torch.nn as nn

class MedicalDiagnosisModel(nn.Module):
    def __init__(self, input_dim: int, hidden_dim: int, num_classes: int):
        super().__init__()
        self.encoder = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(hidden_dim, hidden_dim // 2),
            nn.ReLU(),
            nn.Dropout(0.2)
        )
        
        self.classifier = nn.Linear(hidden_dim // 2, num_classes)
        self.attention = nn.MultiheadAttention(hidden_dim // 2, num_heads=8)
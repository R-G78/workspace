import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from typing import Dict
from sklearn.metrics import classification_report, confusion_matrix
import matplotlib.pyplot as plt
import seaborn as sns

class MedicalModelEvaluator:
    def __init__(self, model: nn.Module):
        self.model = model
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        
    def evaluate(self, test_loader: DataLoader) -> Dict[str, float]:
        self.model.eval()
        all_preds = []
        all_labels = []
        
        with torch.no_grad():
            for features, labels in test_loader:
                features = features.to(self.device)
                outputs = self.model(features)
                preds = outputs.argmax(dim=1).cpu()
                all_preds.extend(preds.numpy())
                all_labels.extend(labels.numpy())
                
        return classification_report(all_labels, all_preds, output_dict=True)
    
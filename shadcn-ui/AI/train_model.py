import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from typing import Dict, Any
import wandb

class MedicalModelTrainer:
    def __init__(self, model: nn.Module, config: Dict[str, Any]):
        self.model = model
        self.config = config
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        wandb.init(project="medical-diagnosis-ai", config=config)
        
    def train(self, 
              train_loader: DataLoader, 
              val_loader: DataLoader,
              epochs: int):
        optimizer = torch.optim.AdamW(self.model.parameters(), 
                                    lr=self.config['learning_rate'])
        criterion = nn.CrossEntropyLoss()
        
        for epoch in range(epochs):
            self.model.train()
            for batch in train_loader:
                features, labels = batch
                features = features.to(self.device)
                labels = labels.to(self.device)
                
                optimizer.zero_grad()
                outputs = self.model(features)
                loss = criterion(outputs, labels)
                loss.backward()
                optimizer.step()
                
                wandb.log({"train_loss": loss.item()})
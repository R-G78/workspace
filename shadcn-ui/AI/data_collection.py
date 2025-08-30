import pandas as pd
import numpy as np
from pathlib import Path
from typing import Dict, List, Any
import requests
import wfdb

class MedicalDataIngestion:
    def __init__(self, data_dir: str = "data"):
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(exist_ok=True)
    
    def fetch_mimic_data(self) -> Dict[str, pd.DataFrame]:
        """Fetch MIMIC-IV dataset from PhysioNet using wfdb"""
        datasets = {}
        
        try:
            # Download MIMIC-IV data using wfdb
            wfdb.dl_database('mimic4wdb', self.data_dir)
            
            # Read the data into pandas DataFrames
            for record in wfdb.get_record_list('mimic4wdb'):
                data = wfdb.rdrecord(record, pn_dir=str(self.data_dir))
                datasets[record] = pd.DataFrame(data.p_signal, columns=data.sig_name)
                
        except Exception as e:
            print(f"Error fetching MIMIC data: {e}")
            
        return datasets
    
import os
from openai import OpenAI
from pinecone import Pinecone
import wandb
from dotenv import load_dotenv

def check_env_variables():
    required_vars = [
        'VITE_OPENAI_API_KEY',
        'VITE_PINECONE_API_KEY',
        'VITE_PINECONE_ENV',
        'VITE_WANDB_API_KEY'
    ]
    
    missing = []
    for var in required_vars:
        if not os.getenv(var):
            missing.append(var)
    
    if missing:
        print(f"❌ Missing environment variables: {', '.join(missing)}")
        return False
    
    print("✅ All required environment variables are set")
    return True

def test_openai_connection():
    try:
        client = OpenAI(api_key=os.getenv('VITE_OPENAI_API_KEY'))
        models = client.models.list()
        print("✅ Successfully connected to OpenAI")
        return True
    except Exception as e:
        print(f"❌ OpenAI connection failed: {str(e)}")
        return False

def test_pinecone_connection():
    try:
        pc = Pinecone(api_key=os.getenv('VITE_PINECONE_API_KEY'))
        indexes = pc.list_indexes()
        print("✅ Successfully connected to Pinecone")
        return True
    except Exception as e:
        print(f"❌ Pinecone connection failed: {str(e)}")
        return False

def test_wandb_connection():
    try:
        wandb.login(key=os.getenv('VITE_WANDB_API_KEY'))
        print("✅ Successfully connected to Weights & Biases")
        return True
    except Exception as e:
        print(f"❌ Weights & Biases connection failed: {str(e)}")
        return False

def main():
    print("Checking AI services configuration...")
    print("-" * 50)
    
    # Load environment variables
    load_dotenv()
    
    # Run checks
    env_ok = check_env_variables()
    if not env_ok:
        return
    
    openai_ok = test_openai_connection()
    pinecone_ok = test_pinecone_connection()
    wandb_ok = test_wandb_connection()
    
    print("-" * 50)
    if all([openai_ok, pinecone_ok, wandb_ok]):
        print("✅ All services are configured correctly!")
    else:
        print("❌ Some services failed to connect. Please check the errors above.")

if __name__ == "__main__":
    main()

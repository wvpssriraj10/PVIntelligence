import os

DIRS = ["data/raw", "data/processed", "notebooks", "src", "models", "outputs"]

def init_repo():
    for d in DIRS:
        os.makedirs(d, exist_ok=True)
    print("Project directory structure verified.")

if __name__ == "__main__":
    init_repo()

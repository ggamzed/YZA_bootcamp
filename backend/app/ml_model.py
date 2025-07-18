import os
import pickle

from river import compose, linear_model
from river.preprocessing import StandardScaler, FeatureHasher

class PracticeModel:
    def __init__(self):
        self.model_path = os.path.join(os.path.dirname(__file__), "model.pkl")

        if os.path.exists(self.model_path):
            with open(self.model_path, "rb") as f:
                self.model = pickle.load(f)
        else:
            num_pipeline = StandardScaler()
            cat_pipeline = FeatureHasher(n_features=2**10)
            self.model = (
                compose.TransformerUnion(
                    num_pipeline,
                    cat_pipeline
                )
                | linear_model.LogisticRegression()
            )

    def predict(self, X):
        return self.model.predict_proba_one(X)

    def update(self, X, y):
        self.model.learn_one(X, y)
        with open(self.model_path, "wb") as f:
            pickle.dump(self.model, f)

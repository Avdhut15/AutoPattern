import pandas as pd
import numpy as np

# Create a synthetic dataset with some patterns and anomalies
np.random.seed(42)

# Cluster 1 (Normal)
n1 = 100
c1_f1 = np.random.normal(5, 1, n1)
c1_f2 = np.random.normal(5, 1, n1)
c1_f3 = c1_f1 * 0.8 + np.random.normal(0, 0.5, n1) # Correlated with f1

# Cluster 2 (Normal)
n2 = 100
c2_f1 = np.random.normal(15, 2, n2)
c2_f2 = np.random.normal(15, 2, n2)
c2_f3 = c2_f2 * -0.6 + np.random.normal(0, 0.5, n2) # Correlated with f2

# Anomalies (Noise)
n3 = 10
c3_f1 = np.random.uniform(0, 20, n3)
c3_f2 = np.random.uniform(0, 20, n3)
c3_f3 = np.random.uniform(0, 20, n3)

f1 = np.concatenate([c1_f1, c2_f1, c3_f1])
f2 = np.concatenate([c1_f2, c2_f2, c3_f2])
f3 = np.concatenate([c1_f3, c2_f3, c3_f3])
labels = ['A']*n1 + ['B']*n2 + ['Anomaly']*n3
cat_feature = np.random.choice(['Category 1', 'Category 2', 'Category 3'], size=n1+n2+n3)

# Add some missing values
f1[np.random.choice(len(f1), 5)] = np.nan

df = pd.DataFrame({
    'Feature_1': f1,
    'Feature_2': f2,
    'Feature_3': f3,
    'Label': labels,
    'Categorical_Col': cat_feature
})

df.to_csv('test_dataset.csv', index=False)
print("Created test_dataset.csv with 210 rows for testing.")

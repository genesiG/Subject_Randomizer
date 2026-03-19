# Skill: Covariate Adaptive Randomization (Minimization)

## Core Logic Requirements
When assigning a new research subject (mouse) to a group, the algorithm must:
1.  Read the current balance of all assigned groups.
2.  Temporarily assign the new subject to Group 1, calculate the total study imbalance, then repeat for Group 2, Group 3, etc.
3.  Permanently assign the subject to the group that yields the lowest Total Imbalance Score.

## Variable Handling
* **Continuous Variables (e.g., Weight, Baseline Tumor Volume):** Calculate the difference in **Means** across groups.
* **Categorical Variables (e.g., Sex, Cage ID):** Calculate the difference in **Frequency Counts** (marginal totals) across groups.

## Contextual Edge Cases
* If testing specific formulations, the algorithm must ensure that control groups and treatment groups maintain strict variance control to prevent skewed adverse effect data. 
* Always apply a random shuffle to the input array *before* running the minimization to prevent entry-order bias.
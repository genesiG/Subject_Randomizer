/**
 * ============================================================
 *  Subject Randomizer — Covariate-Adaptive Minimization Engine
 * ============================================================
 *  Pure-function JavaScript.  No UI, no DOM, no side-effects.
 *
 *  Terminology
 *  -----------
 *  subject : { [colName]: value }          — one row of input data
 *  schema  : { [colName]: "continuous" | "categorical" | "id" }
 *  groups  : Array<Array<subject>>         — groups[i] = subjects in group i
 */

/* ── helpers ─────────────────────────────────────────────────── */

/**
 * Fisher-Yates (Knuth) shuffle — returns a NEW shuffled copy.
 * Eliminates entry-order bias as required by SKILL_MINIMIZATION §Edge Cases.
 */
function fisherYatesShuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Mean of an array of numbers. Returns 0 for empty arrays.
 */
function mean(nums) {
  if (nums.length === 0) return 0;
  return nums.reduce((s, v) => s + v, 0) / nums.length;
}

/* ── imbalance scorers ───────────────────────────────────────── */

/**
 * Continuous-variable imbalance
 * = range of group means  (max mean − min mean)
 *
 * A perfectly balanced study has range ≈ 0.
 */
function calcContinuousImbalance(groups, colName) {
  const means = groups.map((g) => {
    const vals = g.map((s) => parseFloat(s[colName])).filter((v) => !isNaN(v));
    return mean(vals);
  });
  return Math.max(...means) - Math.min(...means);
}

/**
 * Categorical-variable imbalance
 * = Σ over every category level of (maxCount − minCount)
 *
 * This penalises ANY level that is unevenly distributed.
 */
function calcCategoricalImbalance(groups, colName) {
  // Collect the universe of levels across all groups
  const levelSet = new Set();
  groups.forEach((g) => g.forEach((s) => levelSet.add(String(s[colName]))));

  let imbalance = 0;
  for (const level of levelSet) {
    const counts = groups.map(
      (g) => g.filter((s) => String(s[colName]) === level).length
    );
    imbalance += Math.max(...counts) - Math.min(...counts);
  }
  return imbalance;
}

/**
 * Total study imbalance across every tracked variable.
 *
 * schema entries marked "id" are ignored (they are identifiers,
 * not balancing variables).
 */
function calcTotalImbalance(groups, schema) {
  let total = 0;
  for (const [col, type] of Object.entries(schema)) {
    if (type === "continuous") {
      total += calcContinuousImbalance(groups, col);
    } else if (type === "categorical") {
      total += calcCategoricalImbalance(groups, col);
    }
    // "id" columns are skipped
  }
  return total;
}

/* ── assignment ──────────────────────────────────────────────── */

/**
 * Try placing `subject` into every group and return the index of
 * the group that yields the lowest total imbalance.
 *
 * Ties are broken at random so repeated runs are non-deterministic
 * (another layer of bias protection).
 */
function assignSubject(subject, currentGroups, numGroups, schema) {
  let bestScore = Infinity;
  let bestIndices = [];

  for (let g = 0; g < numGroups; g++) {
    // Deep-copy groups and tentatively add subject to group g
    const trial = currentGroups.map((grp) => grp.slice());
    trial[g].push(subject);

    const score = calcTotalImbalance(trial, schema);

    if (score < bestScore) {
      bestScore = score;
      bestIndices = [g];
    } else if (score === bestScore) {
      bestIndices.push(g);
    }
  }

  // Break ties randomly
  return bestIndices[Math.floor(Math.random() * bestIndices.length)];
}

/* ── orchestrator ────────────────────────────────────────────── */

/**
 * Run the full minimization procedure.
 *
 * @param {Object[]} subjects  – array of subject row objects
 * @param {number}   numGroups – number of treatment groups (≥ 2)
 * @param {Object}   schema    – { colName: "continuous"|"categorical"|"id" }
 * @returns {{ groups: Object[][], assignments: { subject: Object, group: number }[] }}
 */
function runMinimization(subjects, numGroups, schema) {
  // 1. Shuffle to eliminate entry-order bias
  const shuffled = fisherYatesShuffle(subjects);

  // 2. Initialise empty groups
  const groups = Array.from({ length: numGroups }, () => []);

  // 3. Sequentially assign each subject to the optimal group
  const assignments = [];
  for (const subject of shuffled) {
    const g = assignSubject(subject, groups, numGroups, schema);
    groups[g].push(subject);
    assignments.push({ subject, group: g });
  }

  return { groups, assignments };
}

/* ── summary statistics (convenience) ────────────────────────── */

/**
 * Produce a per-group summary object for display in the results table.
 * Returns an array (one entry per group) of:
 *   { groupIndex, count, means: { col: val }, counts: { col: { level: n } } }
 */
function summarizeGroups(groups, schema) {
  return groups.map((g, idx) => {
    const summary = { groupIndex: idx, count: g.length, means: {}, counts: {} };

    for (const [col, type] of Object.entries(schema)) {
      if (type === "continuous") {
        const vals = g.map((s) => parseFloat(s[col])).filter((v) => !isNaN(v));
        summary.means[col] = vals.length ? mean(vals) : null;
      } else if (type === "categorical") {
        const freq = {};
        g.forEach((s) => {
          const key = String(s[col]);
          freq[key] = (freq[key] || 0) + 1;
        });
        summary.counts[col] = freq;
      }
    }
    return summary;
  });
}

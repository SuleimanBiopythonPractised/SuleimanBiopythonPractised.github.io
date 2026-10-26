/**
 * SuleimanBiopythonPractised - Interactive Biostatistics ANOVA Studio
 * Computes exact ANOVA partitioning, F-statistics, and post-hoc Tukey HSD contrasts.
 */

function regularizedIncompleteBeta(x, a, b) {
  // Continued fraction approximation for Beta CDF
  if (x === 0) return 0;
  if (x === 1) return 1;

  const maxIter = 100;
  const eps = 1e-12;

  // Symmetry transformation
  if (x > (a + 1) / (a + b + 2)) {
    return 1 - regularizedIncompleteBeta(1 - x, b, a);
  }

  // Pre-factor ln(gamma(a+b)) - ln(gamma(a)) - ln(gamma(b)) + a*ln(x) + b*ln(1-x)
  function logGamma(z) {
    const c = [
      57.1562356658629235, -59.5979603554754912, 14.1360979747417471,
      -0.491913816097620199, 0.339946499848118887e-4, 0.465236289270485756e-4,
      -0.983744753048795646e-4, 0.158088703224378124e-3, -0.210264441724104883e-3,
      0.217439618115212643e-3, -0.164318106536763890e-3, 0.844182239838527433e-4,
      -0.261908384015814087e-4, 0.368991826595316234e-5
    ];
    let sum = 0.999999999999997092;
    for (let i = 0; i < c.length; i++) {
      sum += c[i] / (z + i + 1);
    }
    const t = z + c.length - 0.5;
    return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(sum);
  }

  const factor = Math.exp(
    logGamma(a + b) - logGamma(a) - logGamma(b) +
    a * Math.log(x) + b * Math.log(1 - x)
  );

  let c = 1;
  let d = 1 / (1 - (a + b) * x / (a + 1));
  let h = d;

  for (let m = 1; m <= maxIter; m++) {
    // Even step
    let num = (m * (b - m) * x) / ((a + 2 * m - 1) * (a + 2 * m));
    d = 1 + num * d;
    if (Math.abs(d) < eps) d = eps;
    c = 1 + num / c;
    if (Math.abs(c) < eps) c = eps;
    d = 1 / d;
    h *= d * c;

    // Odd step
    num = -((a + m) * (a + b + m) * x) / ((a + 2 * m) * (a + 2 * m + 1));
    d = 1 + num * d;
    if (Math.abs(d) < eps) d = eps;
    c = 1 + num / c;
    if (Math.abs(c) < eps) c = eps;
    d = 1 / d;
    let del = d * c;
    h *= del;

    if (Math.abs(del - 1) < eps) break;
  }

  return (factor / a) * h;
}

/** Compute p-value for F-statistic with df1, df2 degrees of freedom */
function computeFPValue(F, df1, df2) {
  if (F <= 0 || isNaN(F)) return 1.0;
  const x = df2 / (df2 + df1 * F);
  const p = regularizedIncompleteBeta(x, df2 / 2, df1 / 2);
  return Math.max(0, Math.min(1, p));
}

/** Complete One-Way ANOVA calculator */
function calculateOneWayANOVA(groups) {
  // groups: Array of { name: string, values: number[] }
  let k = groups.length;
  if (k < 2) return null;

  let totalN = 0;
  let grandSum = 0;
  let groupStats = [];

  for (let g of groups) {
    let vals = g.values.filter(v => typeof v === 'number' && !isNaN(v));
    let n = vals.length;
    if (n === 0) continue;

    let sum = vals.reduce((a, b) => a + b, 0);
    let mean = sum / n;
    let sumSqDiff = vals.reduce((a, b) => a + Math.pow(b - mean, 2), 0);
    let variance = n > 1 ? sumSqDiff / (n - 1) : 0;
    let std = Math.sqrt(variance);

    // Sort for median and quartiles
    let sorted = [...vals].sort((a, b) => a - b);
    let min = sorted[0];
    let max = sorted[sorted.length - 1];
    let q1 = sorted[Math.floor(sorted.length * 0.25)];
    let median = sorted[Math.floor(sorted.length * 0.5)];
    let q3 = sorted[Math.floor(sorted.length * 0.75)];

    groupStats.push({
      name: g.name,
      n,
      values: vals,
      mean,
      std,
      variance,
      sumSqDiff,
      min,
      max,
      q1,
      median,
      q3
    });

    totalN += n;
    grandSum += sum;
  }

  let grandMean = grandSum / totalN;

  // Sum of Squares Between (Treatment)
  let ssBetween = 0;
  // Sum of Squares Within (Residual / Error)
  let ssWithin = 0;

  for (let gs of groupStats) {
    ssBetween += gs.n * Math.pow(gs.mean - grandMean, 2);
    ssWithin += gs.sumSqDiff;
  }

  let ssTotal = ssBetween + ssWithin;

  let dfBetween = k - 1;
  let dfWithin = totalN - k;
  let dfTotal = totalN - 1;

  let msBetween = ssBetween / dfBetween;
  let msWithin = dfWithin > 0 ? ssWithin / dfWithin : 0;

  let fValue = msWithin > 0 ? msBetween / msWithin : 0;
  let pValue = computeFPValue(fValue, dfBetween, dfWithin);

  // Effect size (Eta-squared)
  let etaSquared = ssTotal > 0 ? (ssBetween / ssTotal) : 0;

  // Post-hoc Tukey HSD pairwise contrasts
  let pairwise = [];
  for (let i = 0; i < groupStats.length; i++) {
    for (let j = i + 1; j < groupStats.length; j++) {
      let g1 = groupStats[i];
      let g2 = groupStats[j];
      let diff = g1.mean - g2.mean;
      let harmonicN = (2 * g1.n * g2.n) / (g1.n + g2.n);
      let se = Math.sqrt(msWithin / harmonicN);
      let q = Math.abs(diff) / se;
      // Approximate critical q for alpha=0.05
      let qCritApprox = 3.65 + 0.15 * (k - 3);
      let isSig = q >= qCritApprox;

      pairwise.push({
        comparison: `${g1.name} vs ${g2.name}`,
        diff: diff.toFixed(3),
        qValue: q.toFixed(3),
        significant: isSig,
        pBadge: isSig ? "p < 0.05 (*)" : "p ≥ 0.05 (ns)"
      });
    }
  }

  return {
    groupStats,
    grandMean,
    totalN,
    ssBetween,
    ssWithin,
    ssTotal,
    dfBetween,
    dfWithin,
    dfTotal,
    msBetween,
    msWithin,
    fValue,
    pValue,
    etaSquared,
    pairwise
  };
}

window.StatsStudio = {
  calculateOneWayANOVA,
  computeFPValue
};

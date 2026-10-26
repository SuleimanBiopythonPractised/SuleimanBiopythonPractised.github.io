/**
 * SuleimanBiopythonPractised - Interactive Sequence Analysis Studio
 * Client-side sequence operations, physicochemical metrics, and dynamic alignment.
 */

const GENETIC_CODE = {
  'ATA':'I', 'ATC':'I', 'ATT':'I', 'ATG':'M',
  'ACA':'T', 'ACC':'T', 'ACG':'T', 'ACT':'T',
  'AAC':'N', 'AAT':'N', 'AAA':'K', 'AAG':'K',
  'AGC':'S', 'AGT':'S', 'AGA':'R', 'AGG':'R',
  'CTA':'L', 'CTC':'L', 'CTG':'L', 'CTT':'L',
  'CCA':'P', 'CCC':'P', 'CCG':'P', 'CCT':'P',
  'CAC':'H', 'CAT':'H', 'CAA':'Q', 'CAG':'Q',
  'CGA':'R', 'CGC':'R', 'CGG':'R', 'CGT':'R',
  'GTA':'V', 'GTC':'V', 'GTG':'V', 'GTT':'V',
  'GCA':'A', 'GCC':'A', 'GCG':'A', 'GCT':'A',
  'GAC':'D', 'GAT':'D', 'GAA':'E', 'GAG':'E',
  'GGA':'G', 'GGC':'G', 'GGG':'G', 'GGT':'G',
  'TCA':'S', 'TCC':'S', 'TCG':'S', 'TCT':'S',
  'TTC':'F', 'TTT':'F', 'TTA':'L', 'TTG':'L',
  'TAC':'Y', 'TAT':'Y', 'TAA':'*', 'TAG':'*',
  'TGC':'C', 'TGT':'C', 'TGA':'*', 'TGG':'W',
};

const SAMPLE_SEQUENCES = {
  insulin: "ATGGCCCTGTGGATGCGCCTCCTGCCCCTGCTGGCGCTGCTGGCCCTCTGGGGACCTGACCCAGCCGCAGCCTTTGTGAACCAACACCTGTGCGGCTCACACCTGGTGGAAGCTCTCTACCTAGTGTGCGGGGAACGAGGCTTCTTCTACACACCCAAGACCCGCCGGGAGGCAGAGGACCTGCAGGTGGGGCAGGTGGAGCTGGGCGGTGGCCCGGGTGCAGGCAGCCTGCAGCCCTTGGCCCTGGAGGGGTCCCTGCAGAAGCGTGGCATTGTGGAACAATGCTGTACCAGCATCTGCTCCCTCTACCAGCTGGAGAACTACTGCAACTAG",
  gfp: "ATGGTGAGCAAGGGCGAGGAGCTGTTCACCGGGGTGGTGCCCATCCTGGTCGAGCTGGACGGCGACGTAAACGGCCACAAGTTCAGCGTGTCCGGCGAGGGCGAGGGCGATGCCACCTACGGCAAGCTGACCCTGAAGTTCATCTGCACCACCGGCAAGCTGCCCGTGCCCTGGCCCACCCTCGTGACCACCCTGACCTACGGCGTGCAGTGCTTCAGCCGCTACCCCGACCACATGAAGCAGCACGACTTCTTCAAGTCCGCCATGCCCGAAGGCTACGTCCAGGAGCGCACCATCTTCTTCAAGGACGACGGCAACTACAAGACCCGCGCCGAGGTGAAGTTCGAGGGCGACACCCTGGTGAACCGCATCGAGCTGAAGGGCATCGACTTCAAGGAGGACGGCAACATCCTGGGGCACAAGCTGGAGTACAACTACAACAGCCACAACGTCTATATCATGGCCGACAAGCAGAAGAACGGCATCAAGGTGAACTTCAAGATCCGCCACAACATCGAGGACGGCAGCGTGCAGCTCGCCGACCACTACCAGCAGAACACCCCCATCGGCGACGGCCCCGTGCTGCTGCCCGACAACCACTACCTGAGCACCCAGTCCGCCCTGAGCAAAGACCCCAACGAGAAGCGCGATCACATGGTCCTGCTGGAGTTCGTGACCGCCGCCGGGATCACTCTCGGCATGGACGAGCTGTACAAGTAA",
  covid_spike_fragment: "ATGTTTGTTTTTCTTGTTTTATTGCCACTAGTCTCTAGTCAGTGTGTTAATCTTACAACCAGAACTCAATTACCCCCTGCATACACTAATTCTTTCACACGTGGTGTTTATTACCCTGACAAAGTTTTCAGATCCTCAGTTTTACATTCAACTCAGGACTTGTTCTTACCTTTCTTTTCCAATGTTACTTGGTTCCATGCTATACATGTCTCTGGGACCAATGGTACTAAGAGGTTTGATAACCCTGTCCTACCATTTAATGATGGTGTTTATTTTGCTTCCACTGAGAAGTCTAACATAATAAGAGGCTGGATTTTTGGT",
};

/** Clean and sanitize raw sequence input */
function cleanSequence(raw) {
  if (!raw) return "";
  // Strip fasta headers if present
  let lines = raw.split("\n");
  let seqLines = lines.filter(l => !l.trim().startsWith(">"));
  let clean = seqLines.join("").replace(/[^a-zA-Z]/g, "").toUpperCase();
  return clean;
}

/** Compute sequence physicochemical metrics */
function analyzeSequence(dna) {
  const len = dna.length;
  if (len === 0) return null;

  let counts = { A: 0, C: 0, G: 0, T: 0, other: 0 };
  for (let char of dna) {
    if (counts[char] !== undefined) counts[char]++;
    else counts.other++;
  }

  const gc = ((counts.G + counts.C) / len) * 100;
  const at = ((counts.A + counts.T) / len) * 100;

  // Approximate Molecular Weight (ssDNA average ~330 Da per nt)
  const molWeightKDa = (len * 0.33).toFixed(2);

  // Melting temperature calculation:
  // Wallace rule if < 14: 2*(A+T) + 4*(G+C)
  // Nearest-Neighbor base formula if >= 14
  let tm = 0;
  if (len < 14) {
    tm = 2 * (counts.A + counts.T) + 4 * (counts.G + counts.C);
  } else {
    tm = 64.9 + 41 * (counts.G + counts.C - 16.4) / len;
  }

  // Transcription (DNA to mRNA)
  const mrna = dna.replace(/T/g, "U");

  // Reverse Complement
  const complementMap = { A: 'T', T: 'A', C: 'G', G: 'C' };
  let revComp = "";
  for (let i = len - 1; i >= 0; i--) {
    revComp += complementMap[dna[i]] || 'N';
  }

  // Translation (Standard genetic code, frame 1)
  let protein = "";
  for (let i = 0; i < len - 2; i += 3) {
    let codon = dna.substr(i, 3);
    protein += GENETIC_CODE[codon] || "X";
  }

  return {
    length: len,
    counts,
    gcPercent: gc.toFixed(2),
    atPercent: at.toFixed(2),
    molWeightKDa,
    tm: tm.toFixed(1),
    mrna,
    revComp,
    protein
  };
}

/** Dynamic Pairwise Alignment (Needleman-Wunsch / Smith-Waterman) */
function alignPairwise(seq1, seq2, isLocal = false, match = 2, mismatch = -1, gap = -2) {
  const m = seq1.length;
  const n = seq2.length;
  if (m === 0 || n === 0) return null;

  // Initialize scoring matrix
  let dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  if (!isLocal) {
    for (let i = 0; i <= m; i++) dp[i][0] = i * gap;
    for (let j = 0; j <= n; j++) dp[0][j] = j * gap;
  }

  let maxScore = -Infinity;
  let maxI = 0, maxJ = 0;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      let diag = dp[i - 1][j - 1] + (seq1[i - 1] === seq2[j - 1] ? match : mismatch);
      let up = dp[i - 1][j] + gap;
      let left = dp[i][j - 1] + gap;
      
      if (isLocal) {
        dp[i][j] = Math.max(0, diag, up, left);
        if (dp[i][j] > maxScore) {
          maxScore = dp[i][j];
          maxI = i;
          maxJ = j;
        }
      } else {
        dp[i][j] = Math.max(diag, up, left);
      }
    }
  }

  // Backtracking
  let align1 = [];
  let align2 = [];
  let matchLine = [];

  let i = isLocal ? maxI : m;
  let j = isLocal ? maxJ : n;

  while ((isLocal ? (i > 0 && j > 0 && dp[i][j] > 0) : (i > 0 || j > 0))) {
    if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + (seq1[i - 1] === seq2[j - 1] ? match : mismatch)) {
      align1.push(seq1[i - 1]);
      align2.push(seq2[j - 1]);
      matchLine.push(seq1[i - 1] === seq2[j - 1] ? "|" : ".");
      i--;
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j] === dp[i - 1][j] + gap)) {
      align1.push(seq1[i - 1]);
      align2.push("-");
      matchLine.push(" ");
      i--;
    } else {
      align1.push("-");
      align2.push(seq2[j - 1]);
      matchLine.push(" ");
      j--;
    }
  }

  align1.reverse();
  align2.reverse();
  matchLine.reverse();

  const totalChars = align1.length;
  let identical = 0;
  for (let k = 0; k < totalChars; k++) {
    if (matchLine[k] === "|") identical++;
  }

  const pid = totalChars > 0 ? ((identical / totalChars) * 100).toFixed(1) : 0;
  const finalScore = isLocal ? maxScore : dp[m][n];

  return {
    score: finalScore,
    length: totalChars,
    identical,
    percentIdentity: pid,
    strSeq1: align1.join(""),
    strMatch: matchLine.join(""),
    strSeq2: align2.join("")
  };
}

// Export to window
window.BioStudio = {
  GENETIC_CODE,
  SAMPLE_SEQUENCES,
  cleanSequence,
  analyzeSequence,
  alignPairwise
};

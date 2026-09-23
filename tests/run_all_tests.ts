/**
 * ExamGuard AI - Comprehensive Automated Test Suite
 * Validates ML Anomaly Detection, Code Execution Sandbox, Auth/JWT, and Persistence
 */

import {
  calculateExplainableRisk,
  getBaselineFeatureComparison,
  IsolationForest,
} from '../src/ml/isolationForest';
import { executeCode } from '../server/services/codingService';
import { hashPassword, comparePassword, generateToken, verifyToken } from '../server/auth/authService';
import { db, initMongo } from '../server/db/mongo';
import { BehavioralFeatures, User } from '../src/types';

let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    testsPassed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    testsFailed++;
  }
}

async function runTests() {
  console.log('\n======================================================');
  console.log('       ExamGuard AI - Automated Verification Suite     ');
  console.log('======================================================\n');

  // -----------------------------------------------------------
  // 1. ISOLATION FOREST & ML ENGINE TESTS
  // -----------------------------------------------------------
  console.log('[Suite 1: ML Isolation Forest & Anomaly Scoring]');

  const normalFeatures: BehavioralFeatures = {
    focus_loss_count: 1,
    focus_loss_duration: 3,
    copy_count: 0,
    paste_count: 0,
    typing_speed: 44,
    typing_variance: 420,
    average_answer_time: 45,
    answer_time_variance: 18,
    mouse_activity_score: 42,
    mouse_idle_time: 25,
    question_navigation_count: 5,
    question_revisit_count: 1,
    back_navigation_count: 0,
    session_duration: 1800,
    code_edit_duration: 300,
    code_paste_count: 0,
    compile_failure_count: 1,
    code_run_count: 4,
    large_insertion_count: 0,
  };

  const anomalousFeatures: BehavioralFeatures = {
    focus_loss_count: 14,
    focus_loss_duration: 190,
    copy_count: 6,
    paste_count: 8,
    typing_speed: 125,
    typing_variance: 22,
    average_answer_time: 6,
    answer_time_variance: 110,
    mouse_activity_score: 95,
    mouse_idle_time: 350,
    question_navigation_count: 42,
    question_revisit_count: 15,
    back_navigation_count: 12,
    session_duration: 1800,
    code_edit_duration: 30,
    code_paste_count: 5,
    compile_failure_count: 0,
    code_run_count: 1,
    large_insertion_count: 4,
  };

  const reportNormal = calculateExplainableRisk(normalFeatures, true);
  const reportAnomalous = calculateExplainableRisk(anomalousFeatures, true);

  assert(reportNormal.riskScore < 40, 'Normal behavioral telemetry produces low risk score (< 40)');
  assert(reportNormal.riskLevel === 'NORMAL', 'Normal telemetry is classified as NORMAL');
  assert(
    reportAnomalous.riskScore >= 55,
    'High anomaly telemetry (frequent tab switches, external paste) produces elevated risk (>= 55)'
  );
  assert(
    reportAnomalous.riskLevel === 'REVIEW' || reportAnomalous.riskLevel === 'HIGH_ANOMALY',
    'Anomalous telemetry is flagged as REVIEW or HIGH_ANOMALY'
  );
  assert(
    reportAnomalous.contributingFactors.length >= 2,
    'Anomaly report contains explainable contributing factors'
  );
  assert(
    reportAnomalous.recommendation.toLowerCase().includes('review') ||
      reportAnomalous.recommendation.toLowerCase().includes('examiner') ||
      reportAnomalous.recommendation.toLowerCase().includes('inspect'),
    'Report emphasizes human review rather than automatic accusation'
  );

  // Baseline comparison
  const comparisons = getBaselineFeatureComparison(anomalousFeatures);
  assert(comparisons.length > 5, 'Baseline feature comparison extracts all active biometric signals');
  const focusLossComparison = comparisons.find(
    (c) => c.featureName === 'focus_loss_count' || c.label.toLowerCase().includes('focus')
  );
  assert(
    focusLossComparison !== undefined && (focusLossComparison.zScore ?? 0) >= 1.5,
    'Frequent focus loss correctly yields elevated z-score deviation'
  );

  // -----------------------------------------------------------
  // 2. CODE EXECUTION SANDBOX TESTS
  // -----------------------------------------------------------
  console.log('\n[Suite 2: Code Execution & Isolation Sandbox]');

  const testCases = [
    { id: 'tc-1', input: '3\n4', expectedOutput: '7', hidden: false },
    { id: 'tc-2', input: '10\n20', expectedOutput: '30', hidden: true },
  ];

  const validJsCode = `
    const parts = input.trim().split('\\n').map(x => parseInt(x.trim(), 10));
    console.log(parts[0] + parts[1]);
  `;

  const runResult = await executeCode({
    code: validJsCode,
    language: 'javascript',
    testCases,
    isExaminer: false,
  });

  assert(runResult.status === 'PASSED', 'Valid JS solution passes all sample and hidden test cases');
  assert(runResult.passedTests === 2, 'Passed 2 of 2 tests');
  assert(
    runResult.testResults[1].input === '[Hidden Test Case]',
    'Hidden test case inputs are masked for student examinee'
  );

  // Test sandbox security against infinite loop
  const infiniteLoopCode = `while(true) {}`;
  const timeoutResult = await executeCode({
    code: infiniteLoopCode,
    language: 'javascript',
    testCases,
    timeLimitMs: 500,
  });
  assert(
    timeoutResult.status === 'TIMEOUT' || timeoutResult.status === 'COMPILE_ERROR',
    'Sandbox terminates infinite execution via strict time limit'
  );

  // -----------------------------------------------------------
  // 3. AUTHENTICATION & CRYPTOGRAPHIC TESTS
  // -----------------------------------------------------------
  console.log('\n[Suite 3: Authentication, JWT & Password Hashing]');

  const password = 'SecretStudentPass123!';
  const hash = await hashPassword(password);
  assert(hash !== password && hash.startsWith('$2'), 'Bcrypt generates salt and hash');
  const validPass = await comparePassword(password, hash);
  assert(validPass === true, 'Correct password verifies successfully against hash');
  const invalidPass = await comparePassword('WrongPassword', hash);
  assert(invalidPass === false, 'Incorrect password correctly rejected');

  const testUser: User = {
    id: 'usr-test-42',
    name: 'Jane Doe',
    email: 'jane@university.edu',
    role: 'EXAMINER',
    createdAt: new Date().toISOString(),
  };

  const token = generateToken(testUser);
  assert(typeof token === 'string' && token.split('.').length === 3, 'JWT token issued with header, payload, and signature');

  // -----------------------------------------------------------
  // 4. DATABASE & PERSISTENCE TESTS
  // -----------------------------------------------------------
  console.log('\n[Suite 4: Persistent Data Store]');
  await initMongo();

  const user = await db.users().findOne({ email: 'alex.student@smartexam.edu' });
  assert(user !== null && user.name === 'Alex Rivera', 'Database correctly seeds Alex Rivera student');

  const exams = await (await db.exams().find()).toArray();
  assert(exams.length >= 1, 'Database contains default active curriculum exams');

  // -----------------------------------------------------------
  // SUMMARY
  // -----------------------------------------------------------
  console.log('\n======================================================');
  console.log(`Results: ${testsPassed} passed, ${testsFailed} failed`);
  console.log('======================================================\n');

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});

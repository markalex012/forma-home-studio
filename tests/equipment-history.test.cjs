const test=require('node:test');
const assert=require('node:assert/strict');
const F=require('../studio-core.js');
test('completion summaries count only matching valid confirmed history entries',()=>{
const records=[{videoId:'a',time:100},{videoId:'a',time:250},{videoId:'b',time:300},{videoId:'a',time:NaN},{videoId:'a',time:-1},{videoId:'a',time:501},null];
assert.deepEqual(F.completionSummary(records,'a',500),{count:2,lastCompletedAt:250});
assert.deepEqual(F.completionSummary(records,'b',500),{count:1,lastCompletedAt:300});
assert.deepEqual(F.completionSummary(records,'c',500),{count:0,lastCompletedAt:null});
assert.deepEqual(F.completionSummary(null,'a',500),{count:0,lastCompletedAt:null});
assert.equal(records.length,7);
});

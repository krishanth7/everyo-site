const {test}=require('node:test');const assert=require('node:assert/strict');
const {examples,concepts}=require('./everyo-overview.js');
test('documented examples keep complete copyable Python and accurate expected outputs',()=>{
 assert.deepEqual(Object.keys(examples),['tensors','gradients','networks']);
 for(const e of Object.values(examples)){assert.match(e.code,/^import everyo as eo\n/);assert.ok(e.explanation.length>40);assert.ok(e.output.length);}
 assert.equal(examples.tensors.result,String(1*3+2*4));
 assert.equal(examples.gradients.result,String(2*2));
 assert.equal(examples.networks.output,String(4*16+16+16*3+3));
 assert.match(examples.gradients.code,/y\.backward\(\)/);
 assert.match(examples.networks.code,/model\.num_parameters\(\)/);
});
test('all interactive concepts have distinct explanations and authentic public APIs',()=>{
 assert.equal(Object.keys(concepts).length,3);assert.equal(new Set(Object.values(concepts).map(c=>c.text)).size,3);
 assert.match(concepts.tensor.code,/eo\.tensor/);assert.match(concepts.gradient.code,/backward/);assert.match(concepts.network.code,/eo\.Sequential/);
});

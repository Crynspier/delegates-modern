import { performance } from 'node:perf_hooks'
import delegate from '../dist/index.js'

const iterations = Number.parseInt(process.env.ITERATIONS ?? '200000', 10)

function bench(label, fn) {
  for (let i=0; i<Math.min(10000, iterations); i++) fn()
  const start = performance.now()
  for (let i=0; i<iterations; i++) fn()
  const elapsed = performance.now()-start
  console.log(`${label}: ${(iterations/(elapsed/1000)).toFixed(0)} ops/s`)
}

bench('method delegation setup + call', () => {
  const obj = { target: { value: 4, add(x) { return this.value + x } } }
  delegate(obj, 'target').method('add')
  obj.add(3)
})

bench('getter + setter delegation setup', () => {
  const obj = { target: { value: 4 } }
  delegate(obj, 'target').access('value')
  obj.value = 8
  void obj.value
})

import delegate, { Delegator, type DelegatedMethodName } from '../src/index.js'

interface Target {
  value: number
  run(message: string): number
}

interface Host {
  target: Target
}

const proto = {} as Host
const d = delegate<Host, Target>(proto, 'target')
d.method('run').getter('value').setter('value').access('value').fluent('value')

const methodName: DelegatedMethodName<Target> = 'run'
const direct = new Delegator<Host, Target>(proto, 'target')
direct.method(methodName)

void d

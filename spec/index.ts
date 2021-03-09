import test from 'ava'

import * as core from '../src/core'

test('getUpdatedVersion', (t) => {
  t.is(core.getUpdatedVersion('*', '1.2.3'), '*')

  t.is(core.getUpdatedVersion('1', '1.2.3'), '1')
  t.is(core.getUpdatedVersion('1', '2.3.4'), '1 || 2')

  t.is(core.getUpdatedVersion('^1.2', '1.2.3'), '^1.2')
  t.is(core.getUpdatedVersion('^1.2', '1.3.4'), '^1.2')
  t.is(core.getUpdatedVersion('^1.2', '2.3.4'), '2')
  t.is(core.getUpdatedVersion('0.2', '0.2.3'), '0.2')
  t.is(core.getUpdatedVersion('0.2', '0.3.1'), '0.3')
  t.is(core.getUpdatedVersion('0.2', '1.2.1'), '1')

  t.is(core.getUpdatedVersion('1.2.3', '1.2.3'), '1.2.3')
  t.is(core.getUpdatedVersion('1.2.3', '2.3.4'), '2.3.4')

  t.is(core.getUpdatedVersion('1.0.0-rc.2', '1.2.3'), '1.2.3')

  t.is(core.getUpdatedVersion('1 || 2', '2.3.4'), '1 || 2')
  t.is(core.getUpdatedVersion('1 || 2', '3.4.5'), '1 || 2 || 3')
  t.is(core.getUpdatedVersion('1 || 2', '4.5.6'), '1 || 2 || 3 || 4')

  t.is(core.getUpdatedVersion('1 || 2 || 3', '3.4.5'), '1 || 2 || 3')
  t.is(core.getUpdatedVersion('1 || 2 || 3', '4.5.6'), '1 || 2 || 3 || 4')
  t.is(core.getUpdatedVersion('1 || 2 || 3', '5.6.7'), '1 || 2 || 3 || 4 || 5')
})

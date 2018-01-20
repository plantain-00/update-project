import * as core from '../dist/core'

it('', () => {
  expect(core.getUpdatedVersion('*', '1.2.3')).toEqual('*')

  expect(core.getUpdatedVersion('1', '1.2.3')).toEqual('1')
  expect(core.getUpdatedVersion('1', '2.3.4')).toEqual('2')

  expect(core.getUpdatedVersion('^1.2', '1.2.3')).toEqual('^1.2')
  expect(core.getUpdatedVersion('^1.2', '1.3.4')).toEqual('^1.2')
  expect(core.getUpdatedVersion('^1.2', '2.3.4')).toEqual('2')
  expect(core.getUpdatedVersion('0.2', '0.2.3')).toEqual('0.2')
  expect(core.getUpdatedVersion('0.2', '0.3.1')).toEqual('0.3')
  expect(core.getUpdatedVersion('0.2', '1.2.1')).toEqual('1')

  expect(core.getUpdatedVersion('1.2.3', '1.2.3')).toEqual('1.2.3')
  expect(core.getUpdatedVersion('1.2.3', '2.3.4')).toEqual('2.3.4')

  expect(core.getUpdatedVersion('1.0.0-rc.2', '1.2.3')).toEqual('1.2.3')

  expect(core.getUpdatedVersion('1 || 2', '2.3.4')).toEqual('1 || 2')
  expect(core.getUpdatedVersion('1 || 2', '3.4.5')).toEqual('1 || 2 || 3')
  expect(core.getUpdatedVersion('1 || 2', '4.5.6')).toEqual('1 || 2 || 3 || 4')

  expect(core.getUpdatedVersion('1 || 2 || 3', '3.4.5')).toEqual('1 || 2 || 3')
  expect(core.getUpdatedVersion('1 || 2 || 3', '4.5.6')).toEqual('1 || 2 || 3 || 4')
  expect(core.getUpdatedVersion('1 || 2 || 3', '5.6.7')).toEqual('1 || 2 || 3 || 4 || 5')
})

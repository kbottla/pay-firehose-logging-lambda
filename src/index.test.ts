const { handler } = require('./index')

const cloudWatchLogsToFirehoseRecords = {
  'owner': '111111111111',
  'logGroup': 'CloudTrail/logs',
  'logStream': '111111111111_CloudTrail/logs_us-east-1',
  'subscriptionFilters': [
    'Destination',
  ],
  'messageType': 'DATA_MESSAGE',
  'logEvents': [
    {
      'id': '31953106606966983378809025079804211143289615424298221568',
      'timestamp': 1432826855000,
      'message': '{"eventVersion":"1.03","userIdentity":{"type":"Root1"}',
    },
    {
      'id': '319531066069669833788090250798042111432896154242982215bb',
      'timestamp': 1432826855012,
      'message': '{"eventVersion":"1.03","userIdentity":{"type":"Root2"}',
    },
  ],
}


describe('The implementation of the data transformer', () => {
  test('should return the transformed record ', async () => {
    const event = {
      'records': [
        {
          'recordId': 'a record id',
          'approximateArrivalTimestamp': 1702212345678,
          'data': Buffer.from(JSON.stringify(cloudWatchLogsToFirehoseRecords)).toString('base64'),
        },
      ],
    }
    const context = { ctx: 'hello' }
    const result = await handler(event, context)
    expect(result.records[0].recordId).toStrictEqual('a record id')
    expect(result.records[0].result).toStrictEqual('Ok')
    //todo: check data
  })

})

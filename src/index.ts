import type { Context, FirehoseTransformationEvent, FirehoseTransformationEventRecord } from 'aws-lambda'

function loadJsonGzipBase64(data: string) {
  const rawRecord = Buffer.from(data, 'base64').toString('utf8')
  return JSON.parse(rawRecord)
}

function deriveSourceType(jsonData: any) {
  return 'test_source_type' //todo
}

function deriveIndex(jsonData: any) {
  return 'test_index' //todo
}

function processRecords(records: FirehoseTransformationEventRecord[]) {
  let okCount = 0, droppedCount = 0, failedCount = 0, droppedDataRecordsCount = 0
  let output = records.map((record: FirehoseTransformationEventRecord) => {
      const decodedData = loadJsonGzipBase64(record.data)
      const recId = record.recordId
      const sourceExtractor = /.*\/(.*)$/
      // CONTROL_MESSAGE are sent by CWL to check if the subscription is reachable.
      // They do not contain actual data.
      if (decodedData.messageType === 'CONTROL_MESSAGE') {
        droppedCount++
        return {
          result: 'Dropped',
          recordId: recId,
        }
      } else if (decodedData.messageType === 'DATA_MESSAGE') {
        if (process.env.DISABLE_LOGS_TO_SPLUNK === 'true') {
          droppedDataRecordsCount++
          return {
            result: 'Dropped',
            recordId: recId,
          }
        } else {
          okCount++

          const transformedRecords = decodedData.logEvents.map((logEvent) => ({
            time: Math.floor(logEvent.timestamp).toString(),
            host: 'lambda',  //todo
            event: logEvent.message,
            source: 'source', //todo
            sourcetype: deriveSourceType(decodedData),
            index: deriveIndex(decodedData),
            metadata: {
              logGroup: decodedData.logGroup,
              logStream: decodedData.logStream,
            },
          }))

          const transformedData = Buffer.from(JSON.stringify(transformedRecords)).toString('base64')

          return {
            recordId: record.recordId,
            result: 'Ok',
            data: transformedData,
          }
        }

      } else {
        failedCount++
        return {
          result: 'ProcessingFailed',
          recordId: recId,
        }
      }
    },
  )

  console.log(
    `Processing completed. Total ${output.length}. Dropped ${droppedCount}. Ok ${okCount}. Failed ${failedCount}. Data records droppped ${droppedDataRecordsCount}`,
  )
  return output
}


exports.handler = async (event: FirehoseTransformationEvent, _: Context) => {
  const output = processRecords(event.records)
  return { records: output }
}

export const R2_ANALYTICS_QUERY = `
  query R2Analytics(
    $accountTag: String!
    $startDate: Time
    $endDate: Time
    $bucketName: String
  ) {
    viewer {
      accounts(
        filter: {
          accountTag: $accountTag
        }
      ) {
        r2OperationsAdaptiveGroups(
          limit: 10000
          filter: {
            datetime_geq: $startDate
            datetime_leq: $endDate
            bucketName: $bucketName
          }
        ) {
          sum {
            requests
          }
          dimensions {
            actionType
            date
          }
        }
      }
    }
  }
`;

export const R2_OPERATIONS_QUERY = R2_ANALYTICS_QUERY;
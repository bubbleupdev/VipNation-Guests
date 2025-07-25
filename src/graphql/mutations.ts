import gql from "graphql-tag";

export const ResetPasswordMutation = gql`
mutation ResetPassword($token: String!, $newPassword: String!) {
    resetPassword(token: $token, newPassword: $newPassword)
}`;


export const FileUploadMutation = gql`
  mutation fileUpload($file: Upload!) {
    fileUpload(file: $file)
  }
`;

export const GetUserTokenByTokenMutation = gql`
  mutation getUserTokenByToken($token: String!) {
    getUserTokenByToken(token: $token) {
      result
      error
      token {
          name
          refreshToken
          accessToken
          expiresAt
          refreshExpire
      }
    }
  }
`;

export const GetUserTokenMutation = gql`
  mutation getUserToken($user: UserLoginInput!) {
    getUserToken(user: $user) {
      result
      error
      token {
          name
          refreshToken
          accessToken
          expiresAt
          refreshExpire
      }
    }
  }
`;

export const setPushMessageTokenMutation = gql`
  mutation SetPushMessageTokenMutation($token: String!) {
    setPushMessageToken(token: $token)
  }
`;


export const deletePushMessageTokenMutation = `mutation DeletePushMessageToken($token: String!) {
  deletePushMessageToken(token: $token)
}`;

export const submitContentMutation = gql`
  mutation submitContent($data: String!, $site: ID!, $path: String!) {
    submitContent(contentInput: { site: $site, path: $path, data: $data }) {
      path
      data
    }
  }
`;

export const submitFormMutation = gql`
  mutation SubmitForm($data: FormSubmitInput!) {
    submitForm(data: $data) {
      formPath
      result
      formData
      data
      errors {
        inputName
        errors
      }
    }
  }
`;

export const RefreshUserToken = gql`
  mutation refreshUserToken($refreshToken: String!) {
    refreshUserToken(refreshToken: $refreshToken) {
      name
      refreshToken
      accessToken
      expiresAt
      refreshExpire
    }
  }
`;

export const CheckInGuestMutation = gql`
  mutation checkInGuestMutation($code: String!) {
    checkInGuest(code: $code) {
       result
       error
    }
  }
`;

export const CheckOutGuestMutation = gql`
  mutation checkOutGuestMutation($code: String!) {
    checkOutGuest(code: $code) {
       result
       error
    }
  }
`;

export const SendSmsToGuestsMutation = gql`
  mutation sendSmsToGuestsMutation($sendType: String!, $message: String!, $tourDateInstanceId: Int!, $listId: String, $checkedIn: Boolean) {
    sendSmsToGuests(sendType: $sendType, message: $message, tourDateInstanceId: $tourDateInstanceId, listId: $listId, checkedIn: $checkedIn)
  }
`;

export const SendRegistrationEmailMutation = gql`
  mutation sendRegistrationEmailMutation($purchaserId: Int!) {
    sendRegistrationEmail(purchaserId: $purchaserId)
  }
`;

export const CheckBatchGuestsMutation = gql`
  mutation checkBatchGuestsMutation($checks: String!, $rnd: Int!) {
    checkBatchGuests(checks: $checks, rnd: $rnd) {
      result
      error
      checks {
          uid
          guestId
          code
          result
          error
      }
    }
  }
`;

export const UploadLogQuery = gql`
    mutation uploadLogQuery($log: String!, $rnd: Int!) {
        uploadLog(log: $log, rnd: $rnd) {
            result
            error
            data
        }
    }`;

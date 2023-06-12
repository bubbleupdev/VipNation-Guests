import gql from "graphql-tag";

export const ResetPasswordMutation = gql`
mutation ResetPassword($token: String!, $newPassword: String!) {
    resetPassword(token: $token, newPassword: $newPassword)
}`;

export const SwapRecipeMutation = gql`
mutation SwapRecipeMutation($oldInstanceId: String!, $newInstanceId: String!) {
    swapRecipe(oldInstanceId: $oldInstanceId, newInstanceId: $newInstanceId) {
       result
       data
       error
       user {
            id
            name
            photo
            email
            firstName
            lastName
            currentDate
            premium
            stat
            roles
            favorites
            currentChallenge
            groceryList
            attributes {
               name
               value
            }
            challenges {
               id
               title
               options
               thumbnail
               locked
               type
               isPlan
               isFeatured
               workoutsCount
               recipesCount
               days {
                  slug
                  title
                  items
               }
            }
       }
    }
}`;

export const ChangeFavoriteMutation = gql`
mutation ChangeFavoriteMutation($instanceId: String!, $action: String!) {
    changeFavorite(instanceId: $instanceId, action: $action) {
       result
       data
       error
       user {
            id
            name
            photo
            email
            firstName
            lastName
            currentDate
            premium
            stat
            roles
            favorites
            currentChallenge
            groceryList
            attributes {
               name
               value
            }
            challenges {
               id
               title
               options
               thumbnail
               locked
               type
               isPlan
               isFeatured
               workoutsCount
               recipesCount
               days {
                  slug
                  title
                  items
               }
            }
       }
    }
}`;

export const JoinChallengeMutation = gql`
mutation JoinChallengeMutation($instanceId: String!) {
    joinChallenge(instanceId: $instanceId) {
       result
       data
       error
       user {
            id
            name
            photo
            email
            firstName
            lastName
            currentDate
            premium
            stat
            roles
            favorites
            currentChallenge
            groceryList
            attributes {
               name
               value
            }
            challenges {
               id
               title
               options
               thumbnail
               locked
               type
               isPlan
               isFeatured
               workoutsCount
               recipesCount
               days {
                  slug
                  title
                  items
               }
            }
       }
    }
}`;

export const CompleteItemMutation = gql`
mutation CompleteItemMutation($instanceId: String!, $item: String!, $day: Int!) {
    completeItem(instanceId: $instanceId, item: $item, day: $day) {
       result
       data
       error
       user {
            id
            name
            photo
            email
            firstName
            lastName
            currentDate
            premium
            stat
            roles
            favorites
            currentChallenge
            groceryList
            attributes {
               name
               value
            }
            challenges {
               id
               title
               options
               thumbnail
               locked
               type
               isPlan
               isFeatured
               workoutsCount
               recipesCount
               days {
                  slug
                  title
                  items
               }
            }
       }
    }
}`;

export const CompletePlanItemMutation = gql`
mutation CompletePlanItemMutation($instanceId: String!, $item: String!, $week: Int!, $day: Int!) {
    completePlanItem(instanceId: $instanceId, item: $item, week: $week, day: $day) {
       result
       data
       error
       user {
            id
            name
            photo
            email
            firstName
            lastName
            currentDate
            premium
            stat
            roles
            favorites
            currentChallenge
            groceryList
            attributes {
               name
               value
            }
            challenges {
               id
               title
               options
               thumbnail
               locked
               type
               isPlan
               isFeatured
               workoutsCount
               recipesCount
               days {
                  slug
                  title
                  items
               }
            }
       }
    }
}`;

export const CompleteChallengeMutation = gql`
mutation CompleteChallengeMutation($instanceId: String!) {
    completeChallenge(instanceId: $instanceId) {
       result
       data
       error
       user {
            id
            name
            photo
            email
            firstName
            lastName
            currentDate
            premium
            stat
            roles
            favorites
            currentChallenge
            groceryList
            attributes {
               name
               value
            }
            challenges {
               id
               title
               options
               thumbnail
               locked
               type
               isPlan
               isFeatured
               workoutsCount
               recipesCount
               days {
                  slug
                  title
                  items
               }
            }
       }
    }
}`;

export const CompleteDayMutation = gql`
mutation CompleteDayMutation($instanceId: String!, $day: String!) {
    completeDay(instanceId: $instanceId, day: $day) {
       result
       data
       error
       user {
            id
            name
            photo
            email
            firstName
            lastName
            currentDate
            premium
            stat
            roles
            favorites
            currentChallenge
            groceryList
            attributes {
               name
               value
            }
            challenges {
               id
               title
               options
               thumbnail
               locked
               type
               isPlan
               isFeatured
               workoutsCount
               recipesCount
               days {
                  slug
                  title
                  items
               }
            }
       }
    }
}`;

export const CompletePlanDayMutation = gql`
mutation CompletePlanDayMutation($instanceId: String!, $week: String!, $day: String!) {
    completePlanDay(instanceId: $instanceId, week: $week, day: $day) {
       result
       data
       error
       user {
            id
            name
            photo
            email
            firstName
            lastName
            currentDate
            premium
            stat
            roles
            favorites
            currentChallenge
            groceryList
            attributes {
               name
               value
            }
            challenges {
               id
               title
               options
               thumbnail
               locked
               type
               isPlan
               isFeatured
               workoutsCount
               recipesCount
               days {
                  slug
                  title
                  items
               }
            }
       }
    }
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
    }
  }
`;

export const CheckInGuestMutation = gql`
  mutation checkInGuestMutation($code: String!) {
    checkInGuest(code: $code)
  }
`;

export const CheckOutGuestMutation = gql`
  mutation checkOutGuestMutation($code: String!) {
    checkOutGuest(code: $code)
  }
`;

import { gql } from '@apollo/client';

export const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      accessToken
    }
  }
`;

export const CREATE_USER = gql`
  mutation CreateUser($input: UserCreateInput!) {
    createUser(input: $input) {
      id
      email
      username
      firstName
      lastName
      role
      status
      lastLogin
      createdAt
      updatedAt
      assignedIssuesCount
      reportedIssuesCount
    }
  }
`;

export const UPDATE_USER = gql`
  mutation UpdateUser($input: UserUpdateInput!) {
    updateUser(input: $input) {
      id
      email
      username
      firstName
      lastName
      role
      status
      lastLogin
      createdAt
      updatedAt
      assignedIssuesCount
      reportedIssuesCount
    }
  }
`;

export const UPDATE_USER_ROLE = gql`
  mutation UpdateUserRole($userId: Int!, $role: UserRole!) {
    updateUserRole(userId: $userId, role: $role) {
      id
      email
      username
      firstName
      lastName
      role
      status
      lastLogin
      createdAt
      updatedAt
      assignedIssuesCount
      reportedIssuesCount
    }
  }
`;

export const DELETE_USER = gql`
  mutation DeleteUser($id: Int!) {
    deleteUser(id: $id)
  }
`;

export const INITIALIZE_PERMISSIONS = gql`
  mutation InitializePermissions {
    initializePermissions
  }
`;

export const CREATE_ISSUE = gql`
  mutation CreateIssue($input: IssueCreateInput!) {
    createIssue(input: $input) {
      id
      title
      description
      enhancedDescription
      status
      priority
      assigneeId
      reporterId
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_ISSUE = gql`
  mutation UpdateIssue($input: IssueUpdateInput!) {
    updateIssue(input: $input) {
      success
      message
      issue {
        id
        title
        description
        enhancedDescription
        status
        priority
        assigneeId
        reporterId
        createdAt
        updatedAt
      }
    }
  }
`;

export const DELETE_ISSUE = gql`
  mutation DeleteIssue($id: Int!) {
    deleteIssue(id: $id) {
      id
      title
    }
  }
`;

export const ENHANCE_DESCRIPTION = gql`
  mutation EnhanceDescription($description: String!) {
    enhanceDescription(description: $description) {
      enhancedText
      markdownHtml
      original
    }
  }
`; 
import { gql } from '@apollo/client';

export const GET_USERS = gql`
  query GetUsers {
    users {
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

export const GET_USER_ACTIVITIES = gql`
  query GetUserActivities($userId: Int, $limit: Int) {
    userActivities(userId: $userId, limit: $limit) {
      id
      activityType
      description
      details
      ipAddress
      userAgent
      createdAt
    }
  }
`;

export const GET_USER_STATS = gql`
  query GetUserStats {
    userStats {
      totalUsers
      activeUsers
      newUsersThisMonth
      usersByRole {
        role
        count
      }
      recentActivity {
        id
        activityType
        description
        details
        ipAddress
        userAgent
        createdAt
      }
    }
  }
`;

export const GET_PERMISSIONS = gql`
  query GetPermissions($role: String) {
    permissions(role: $role)
  }
`;

export const GET_ISSUES = gql`
  query GetIssues {
    issues {
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
      tags {
        id
        name
        color
      }
    }
  }
`;

export const GET_TAGS = gql`
  query GetTags {
    tags {
      id
      name
      color
    }
  }
`;

export const ISSUE_UPDATED_SUBSCRIPTION = gql`
  subscription {
    issueUpdated {
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
      tags {
        id
        name
        color
      }
    }
  }
`; 
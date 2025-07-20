import { ApolloClient, gql } from '@apollo/client';

const CREATE_ISSUE = gql`
  mutation CreateIssue($input: IssueCreateInput!) {
    createIssue(input: $input) {
      id
      title
      description
      status
      priority
      assigneeId
      reporterId
      createdAt
      updatedAt
    }
  }
`;

export const createTestIssues = async (client: ApolloClient<any>) => {
    const testIssues = [
        {
            title: 'Fix login bug',
            description: 'Users cannot log in with correct credentials',
            status: 'OPEN',
            priority: 'HIGH',
            assigneeId: 1
        },
        {
            title: 'Add dark mode',
            description: 'Implement dark theme for better user experience',
            status: 'IN_PROGRESS',
            priority: 'MEDIUM',
            assigneeId: 2
        },
        {
            title: 'Update documentation',
            description: 'Update API documentation with new endpoints',
            status: 'CLOSED',
            priority: 'LOW',
            assigneeId: 3
        },
        {
            title: 'Database optimization',
            description: 'Optimize database queries for better performance',
            status: 'OPEN',
            priority: 'URGENT',
            assigneeId: null
        },
        {
            title: 'Mobile responsive design',
            description: 'Make the interface responsive for mobile devices',
            status: 'IN_PROGRESS',
            priority: 'HIGH',
            assigneeId: 1
        },
        {
            title: 'Security audit',
            description: 'Conduct security audit of the application',
            status: 'CLOSED',
            priority: 'URGENT',
            assigneeId: 2
        }
    ];

    console.log('Creating test issues...');

    for (const issue of testIssues) {
        try {
            const result = await client.mutate({
                mutation: CREATE_ISSUE,
                variables: {
                    input: {
                        title: issue.title,
                        description: issue.description,
                        status: issue.status,
                        priority: issue.priority,
                        assigneeId: issue.assigneeId,
                        reporterId: 1
                    }
                }
            });
            console.log(`Created issue: ${result.data?.createIssue?.title}`);
        } catch (error) {
            console.log(`Issue "${issue.title}" might already exist or error:`, error);
        }
    }

    console.log('Test issues creation completed!');
}; 
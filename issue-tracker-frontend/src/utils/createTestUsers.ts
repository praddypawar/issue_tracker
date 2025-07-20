import { ApolloClient, gql } from '@apollo/client';

const CREATE_USER = gql`
  mutation CreateUser($input: UserCreateInput!) {
    createUser(input: $input) {
      id
      email
      username
      firstName
      lastName
    }
  }
`;

export const createTestUsers = async (client: ApolloClient<any>) => {
    const testUsers = [
        {
            email: 'john.doe@example.com',
            username: 'johndoe',
            firstName: 'John',
            lastName: 'Doe',
            password: 'password123'
        },
        {
            email: 'jane.smith@example.com',
            username: 'janesmith',
            firstName: 'Jane',
            lastName: 'Smith',
            password: 'password123'
        },
        {
            email: 'mike.wilson@example.com',
            username: 'mikewilson',
            firstName: 'Mike',
            lastName: 'Wilson',
            password: 'password123'
        },
        {
            email: 'sarah.jones@example.com',
            username: 'sarahjones',
            firstName: 'Sarah',
            lastName: 'Jones',
            password: 'password123'
        }
    ];

    console.log('Creating test users...');

    for (const user of testUsers) {
        try {
            const result = await client.mutate({
                mutation: CREATE_USER,
                variables: {
                    input: user
                }
            });
            console.log(`Created user: ${result.data?.createUser?.firstName} ${result.data?.createUser?.lastName}`);
        } catch (error) {
            console.log(`User ${user.email} might already exist or error:`, error);
        }
    }

    console.log('Test users creation completed!');
}; 
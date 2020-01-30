import Amplify, { API } from 'aws-amplify';

Amplify.configure({
    API: {
        endpoints: {
            name: 'fish-market-api',
            endpoint: 'https://9fv6uekm86.execute-api.us-east-1.amazonaws.com/prod'
        }
    }
});
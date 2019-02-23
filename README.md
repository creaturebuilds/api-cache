# api-cache

A module for wrapping Creature API methods with cached versions.

## Usage

To wrap an API class or object, start by creating a new store using a Redis client.
```typescript
import redis from 'redis';
import ApiCache, { Store } from '@creaturebuilds/api-cache';

const redisClient = redis.createClient();
const store = new Store(redisClient);
```

Alternatively, you can implement your own store. The store should be responsbile for serializing and formatting JSON data. Ensure that it implements the following methods:
```typescript
class Store {
  async getJSON(key: string) {
    ...
    return JSON.parse(data);
  }

  async setJSON(key: string, data: Object) {
    ...
  }
}
```

Now that we have a store, we can create an ApiCache instance:
```typescript
const apiCache = new ApiCache(store, (context) => {
  return context.user.id;
});
```

The second argument to the ApiCache constructor is a function that returns a unique key from an API method's context argument. This is useful when caching data for individual users. In the example above we return the user's id.

Now we can wrap API methods. Suppose we have an API class like the following:
```typescript
class UserAPI {
  static getUsersByType(args: { type: string }, context: { user: User }) {
    // do some stuff, return some users
  }
}
```

We can easily create a cached version of this API by calling cachify on it:
```typescript
const CachedUserAPI = apiCache.cachify(UserAPI, 'UserAPI', {
  getUsersByType: {
    ttl: '5m',
    useContext: false,
  },
});
```

Now `CachedUserAPI` will return cached users with a time to live of 5 minutes before refreshing the data.
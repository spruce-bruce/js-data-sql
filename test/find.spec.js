var Promise = require('bluebird');
describe('DSSqlAdapter#find', function () {
  it('should find a user in a Sql db', function* () {
    var user = yield adapter.create(User, {name: 'John'});
    var userId = user.id;
    assert.equal(user.name, 'John');
    assert.isDefined(user.id);

    var user2 = yield adapter.find(User, user.id);
    assert.equal(user2.name, 'John');
    assert.isDefined(user2.id);
    assert.equalObjects(user2, {id: userId, name: 'John', age: null, profileId: null});

    var post = yield adapter.create(Post, { content: 'test', userId: userId });
    var postId = post.id;
    assert.equal(post.content, 'test');
    assert.isDefined(post.id);
    assert.isDefined(post.userId);

    var comments = yield [
      adapter.create(Comment, {
        content: 'test2',
        postId: post.id,
        userId: user.id
      }),
      adapter.create(Comment, {
        content: 'test3',
        postId: post.id,
        userId: user.id
      })
    ];

    comments.sort(function (a, b) {
      return a.content > b.content;
    });

    var findPost = yield adapter.find(Post, postId, {with: ['user', 'comment']});
    findPost.comments.sort(function (a, b) {
      return a.content > b.content;
    });
    assert.equalObjects(findPost.user, user);
    assert.equalObjects(findPost.comments, comments);

    yield adapter.destroyAll(Comment);
    yield adapter.destroy(Post, postId);
    var destroyUser = yield adapter.destroy(User, userId);
    assert.isFalse(!!destroyUser);

    try {
      yield adapter.find(User, userId);
      throw new Error('Should not have reached here!');
    } catch (err) {
      console.log(err.stack);
      assert.equal(err.message, 'Not Found!');
    }
  });
});

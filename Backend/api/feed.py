import uuid
from flask import request, jsonify
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt_identity
from Backend.model.user_model import User
from Backend.model.image_model import Image
from Backend.model.post_model import Post, Comment, Like
from Backend.model.homepage_model import Community, UserCommunity


post_ns = Namespace("Post", description="Post and comment handling")

# Model for creating a post
post_model = post_ns.model("Post", {
    "community_id": fields.String(required=True, description="UUID of the joined community"),
    "topic": fields.String(required=True, description="Topic of the post"),
    "content": fields.String(required=True, description="Post content"),
})


# Model for posting a comment
comment_model = post_ns.model("Comment", {
    "comment": fields.String(required=True, description="Comment content")
})


@post_ns.route("")
class PostFeed(Resource):
    @jwt_required(optional=True)
    def get(self):
        current = get_jwt_identity()
        posts_out = []

        # pull all posts (or your filtered query)
        posts_query = Post.select().order_by(Post.created_at.desc())

        for p in posts_query:
            # 1) total likes
            total_likes = Like.select().where(Like.post == p).count()

            # 2) has *this* user liked it?
            liked = False
            if current:
                liked = Like.select().where(
                    (Like.post == p) & (Like.user_id == current)
                ).exists()

            pic = p.author.profile_picture
            if isinstance(pic, Image):
               photo_url = pic.url
            else:
               photo_url = pic or ""

            posts_out.append({
                "id":           str(p.id),
                "author":       {
                    "username": p.author.username,
                    "photo_url": photo_url,
                },
                "community":    p.community.to_dict(),
                "topic":        p.topic,
                "content":      p.content,
                "created_at":   p.created_at.isoformat(),
                "likes":        total_likes,
                "liked_by_user":liked,
                "comments": [
                   comment.to_dict()
                   for comment in p.comments.order_by(Comment.created_at.asc())
               ],
            })

        return posts_out, 200

    @jwt_required()
    @post_ns.expect(post_model)
    def post(self):
        user_id = get_jwt_identity()
        user = User.get_by_id(user_id)
        if not user:
            return {"error": "User not found"}, 404

        data = request.get_json()
        # 1) Read the FK id
        comm_id = data.get("community_id")

        # 2) Look up the Community row
        try:
            comm = Community.get_by_id(comm_id)
        except Community.DoesNotExist:
            return {"error": "Community not found"}, 404

        # 3) Make sure this user has joined it
        membership = UserCommunity.get_or_none(
            (UserCommunity.user == user) &
            (UserCommunity.community == comm)
        )
        if not membership:
            return {"error": "You must join this community first"}, 403

        # 4) Create the post against the FK
        post = Post.create(
            id        = str(uuid.uuid4()),
            author    = user,
            community = comm,
            topic     = data.get("topic"),
            content   = data.get("content")
        )
        # Reload the post to refresh the author relationship
        post = Post.get(Post.id == post.id)
        return jsonify(post.to_dict())


@post_ns.route("/<string:post_id>/like")
class LikePost(Resource):
    @jwt_required()
    def post(self, post_id):
        user_id = get_jwt_identity()
        post = Post.get_or_none(Post.id == post_id)
        user = User.get_or_none(User.id == user_id)
        if not post or not user:
            return {"error": "Not found"}, 404

        # Toggle the Like row
        existing = Like.get_or_none((Like.post == post) & (Like.user == user))
        if existing:
            existing.delete_instance()
        else:
            Like.create(post=post, user=user)

        # Recompute the true count
        total = Like.select().where(Like.post == post).count()
        # (optional) persist it if you want to keep post.likes in sync
        post.likes = total
        post.save()

        return {"likes": total, "liked_by_user": existing is None}, 200


@post_ns.route("/<string:post_id>/comment")
class CommentPost(Resource):
    @jwt_required()
    @post_ns.expect(comment_model)
    def post(self, post_id):
        try:
            uuid.UUID(post_id)
        except ValueError:
            return {"error": "Invalid post ID. Please try again."}, 400

        user_id = get_jwt_identity()
        user = User.get_or_none(User.id == user_id)
        if not user:
            return {"error": "User not found"}, 404

        post = Post.get_or_none(Post.id == post_id)
        if not post:
            return {"error": "Post not found"}, 404

        data = request.get_json()
        content = data.get("comment")
        if not content:
            return jsonify({"error": "Comment content is required"}), 400

        comment = Comment.create(
            post=post,
            user=user,
            content=content
        )
        return jsonify(comment.to_dict())
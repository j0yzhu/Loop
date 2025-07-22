from flask import request
from flask_restx import Namespace, Resource, fields, reqparse
from flask_jwt_extended import jwt_required, get_jwt_identity
from Backend.model.user_model import User
from Backend.model.community_model import Community, CommunityCategory, Category
from Backend.model.homepage_model import UserCommunity
from Backend.api.loopImage import upload_image, upload_parser, allowed_file

community_ns = Namespace("Community", description="create community")

create_community = community_ns.model("createCommunity", {
    "name": fields.String(required=True),
    "description": fields.String(required=True),
    "categories": fields.List(fields.Integer),
})


@community_ns.route('/categories')
class Topics(Resource):
    def get(self):
        categories = Category.select()
        return [
            {
                'id': category.id,
                'topic': category.topic,
                'subtopic': category.subtopic
            }
            for category in categories
        ]


# Create a Community
@community_ns.route('')
class CreateCommunity(Resource):
    @jwt_required()
    @community_ns.expect(create_community)
    def post(self):
        data = request.get_json()
        user_id = get_jwt_identity()
        user = User.get_by_id(user_id)

        name = data.get("name")
        description = data.get("description")
        categories = data.get("categories")


        required_fields = [name, description, categories]
        if not all(required_fields):
            return {"msg": "Missing required fields."}, 400

        community = Community.create(name=name, description=description, members=1, owner=user)
        UserCommunity.create(user=user, community=community)

        for category_id in categories:
            category = Category.get_or_none(id=category_id)
            if category is None:
                return {"msg": "Category does not exist"}, 400

            CommunityCategory.create(community=community, category=category)

        return {"msg": "Community created successfully.", "community_id": community.id}, 201


search_parser = reqparse.RequestParser()
search_parser.add_argument('query', type=str, help='Search query')
search_parser.add_argument('categories', type=str, help='Comma separated category ids')


@community_ns.route('/searchCommunity')
class SearchCommunity(Resource):
    @community_ns.expect(search_parser)
    def get(self):
        search_term = request.args.get('query', '').strip()
        categories_input = request.args.get('categories', '').strip()

        if categories_input:
            try:
                categories = [int(category) for category in categories_input.split(',')]
            except Exception as e:
                print(e)
                return {"msg": "Invalid categories input"}, 400
        else:
            categories = []

        communities = Community.select()
        if categories:
            communities = communities.join(CommunityCategory).where(CommunityCategory.category.in_(categories))
        communities = communities.where(Community.name.contains(search_term)).order_by(Community.members.desc())

        deduplicated_communities = {community.id: community for community in communities}

        results = [c.to_dict() for c in deduplicated_communities.values()]

        return results, 200

@community_ns.route("/createCommunity/<int:id>/community-picture")
class SetupCommunityPicture(Resource):
    @jwt_required()
    @community_ns.expect(upload_parser)
    def post(self, id):
        user_id = get_jwt_identity()
        user = User.get_by_id(user_id)

        community = Community.get_or_none(id)
        if not community:
            return {"msg": "Community Not Found."}, 400

        file = request.files['file']
        if file and allowed_file(file.filename):
            image = upload_image(file)
            community.community_picture = image
            community.save()

            return {"msg": "File uploaded successfully"}, 201

        return {"msg": "File type not allowed"}, 400


@community_ns.route('/<int:id>')
class CommunityDetails(Resource):
    @jwt_required()
    def get(self, id):
        community = Community.get_or_none(id)
        if not community:
            return {"msg": "Community not found"}, 404

        # Serialize the community
        return community.to_dict(), 200


@community_ns.route('/joined')
class JoinedCommunities(Resource):
    @jwt_required()
    def get(self):
        # 1) figure out who’s calling
        user_id = get_jwt_identity()
        user = User.get_or_none(User.id == user_id)
        if not user:
            return {"error": "User not found"}, 404

        # 2) query their joined communities
        query = (
          Community
          .select(Community)
          .join(UserCommunity)
          .where(UserCommunity.user == user)
        )

        # 3) serialize
        out = [c.to_dict() for c in query]

        return out, 200

@community_ns.route('/<int:id>/members')
class CommunityMembers(Resource):
    @jwt_required()
    def get(self, id):
        user_id = get_jwt_identity()
        user = User.get_by_id(user_id)

        community = Community.get_or_none(Community.id == id)
        if not community:
            return {"msg": "Community not found"}, 404

        # Get all members
        join_qs = UserCommunity.select().where(UserCommunity.community == community)
        members = [join.user for join in join_qs]

        # Include is_friend field
        out = []
        for m in members:
            out.append({
                **m.to_dict(),
                "is_friend": m.is_friend_with(user)
            })

        return out, 200

@community_ns.route('/<int:id>/leave')
class LeaveCommunity(Resource):
    @jwt_required()
    def post(self, id):
        user_id = get_jwt_identity()
        user = User.get_or_none(id=user_id)
        if not user:
            return {"msg": "User not found"}, 404

        community = Community.get_or_none(id=id)
        if not community:
            return {"msg": "Community not found"}, 404

        # Check if user is the owner
        if community.owner.id == user.id:
            return {"msg": "Admin cannot leave the community. Assign a new admin first."}, 400

        # Check if user is part of the community
        uc_link = UserCommunity.get_or_none(UserCommunity.user == user, UserCommunity.community == community)
        if not uc_link:
            return {"msg": "You are not a member of this community."}, 400

        uc_link.delete_instance()

        # Decrement member count
        community.members = Community.members - 1
        community.save()

        return {"msg": "Successfully left the community."}, 200

@community_ns.route('/<int:id>/name')
class EditCommunityName(Resource):
    @jwt_required()
    def patch(self, id):
        user_id = get_jwt_identity()
        user = User.get_by_id(user_id)
        community = Community.get_or_none(id)

        if not community:
            return {"msg": "Community not found"}, 404

        if community.owner != user:
            return {"msg": "Only the community owner can edit the name"}, 403

        data = request.get_json()
        new_name = data.get("name")
        if not new_name or not new_name.strip():
            return {"msg": "Name cannot be empty"}, 400

        community.name = new_name.strip()
        community.save()
        return {"msg": "Community name updated"}, 200

@community_ns.route('/<int:id>/description')
class EditCommunityDescription(Resource):
    @jwt_required()
    def patch(self, id):
        user_id = get_jwt_identity()
        user = User.get_by_id(user_id)
        community = Community.get_or_none(id)

        if not community:
            return {"msg": "Community not found"}, 404

        if community.owner != user:
            return {"msg": "Only the community owner can edit the description"}, 403

        data = request.get_json()
        new_description = data.get("description")
        if new_description is None or not new_description.strip():
            return {"msg": "Description cannot be empty"}, 400

        community.description = new_description.strip()
        community.save()
        return {"msg": "Community description updated"}, 200


@community_ns.route('/<int:id>/change-admin')
class ChangeAdmin(Resource):
    @jwt_required()
    def patch(self, id):
        data = request.get_json()
        new_admin_email = data.get("new_admin_email")

        if not new_admin_email:
            return {"msg": "Missing new_admin_email"}, 400

        user_id = get_jwt_identity()
        current_user = User.get_or_none(id=user_id)
        community = Community.get_or_none(id=id)

        if not community:
            return {"msg": "Community not found"}, 404

        if community.owner.id != current_user.id:
            return {"msg": "Only the current admin can assign a new admin"}, 403

        new_admin = User.get_or_none(User.email == new_admin_email)
        if not new_admin:
            return {"msg": "New admin not found"}, 404

        # Ensure the new admin is a member
        if not UserCommunity.select().where(
            (UserCommunity.user == new_admin) & (UserCommunity.community == community)
        ).exists():
            return {"msg": "User is not a member of this community"}, 400

        # Change admin
        community.owner = new_admin
        community.save()

        return {"msg": "Admin changed successfully"}, 200


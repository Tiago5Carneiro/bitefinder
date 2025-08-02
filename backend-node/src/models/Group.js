const database = require("../config/database");

class Group {
  static async create(code, name, creatorUsername) {
    try {
      const result = await database.query(
        'INSERT INTO "group" (code, name, status, creator_username, max_members) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [code, name, "active", creatorUsername, 6]
      );

      // Add creator as a ready member
      await this.addMember(code, creatorUsername, true);

      return result[0];
    } catch (error) {
      console.error("Error creating group:", error);
      throw error;
    }
  }

  static async findByCode(code) {
    try {
      const groups = await database.query(
        'SELECT * FROM "group" WHERE code = $1',
        [code]
      );
      return groups[0] || null;
    } catch (error) {
      console.error("Error finding group by code:", error);
      throw error;
    }
  }

  static async findActiveByCode(code) {
    try {
      const groups = await database.query(
        'SELECT * FROM "group" WHERE code = $1 AND status = $2',
        [code, "active"]
      );
      return groups[0] || null;
    } catch (error) {
      console.error("Error finding active group by code:", error);
      throw error;
    }
  }

  static async addMember(groupCode, username, isReady = false) {
    try {
      return await database.query(
        "INSERT INTO group_user (group_code, username, is_ready) VALUES ($1, $2, $3)",
        [groupCode, username, isReady]
      );
    } catch (error) {
      console.error("Error adding member to group:", error);
      throw error;
    }
  }

  static async removeMember(groupCode, username) {
    try {
      return await database.query(
        "DELETE FROM group_user WHERE group_code = $1 AND username = $2",
        [groupCode, username]
      );
    } catch (error) {
      console.error("Error removing member from group:", error);
      throw error;
    }
  }

  static async getMembers(groupCode) {
    try {
      return await database.query(
        `
        SELECT u.username, u.name, gu.is_ready, gu.joined_at,
               (u.username = g.creator_username) as is_host
        FROM "user" u
        JOIN group_user gu ON u.username = gu.username
        JOIN "group" g ON gu.group_code = g.code
        WHERE gu.group_code = $1
        ORDER BY gu.joined_at ASC
      `,
        [groupCode]
      );
    } catch (error) {
      console.error("Error getting group members:", error);
      throw error;
    }
  }

  static async updateMemberReadyStatus(groupCode, username, isReady) {
    try {
      return await database.query(
        "UPDATE group_user SET is_ready = $1 WHERE group_code = $2 AND username = $3",
        [isReady, groupCode, username]
      );
    } catch (error) {
      console.error("Error updating member ready status:", error);
      throw error;
    }
  }

  static async updateStatus(code, status) {
    try {
      const validStatuses = ["active", "inactive", "selecting", "matched"];
      if (!validStatuses.includes(status)) {
        throw new Error("Invalid status");
      }

      return await database.query(
        'UPDATE "group" SET status = $1 WHERE code = $2',
        [status, code]
      );
    } catch (error) {
      console.error("Error updating group status:", error);
      throw error;
    }
  }

  static async getUserGroups(username) {
    try {
      return await database.query(
        `
        SELECT g.code, g.name, g.status, g.created_at, g.max_members,
               (g.creator_username = $1) as is_creator,
               (SELECT COUNT(*) FROM group_user WHERE group_code = g.code) as member_count
        FROM "group" g
        JOIN group_user gu ON g.code = gu.group_code
        WHERE gu.username = $1 AND g.status IN ('active', 'selecting')
        ORDER BY g.created_at DESC
      `,
        [username]
      );
    } catch (error) {
      console.error("Error getting user groups:", error);
      throw error;
    }
  }

  static async getMemberVectors(groupCode) {
    try {
      return await database.query(
        `
        SELECT u.food_vector, u.place_vector, u.history_food_vector, u.history_place_vector, u.history
        FROM "user" u
        JOIN group_user gu ON u.username = gu.username
        WHERE gu.group_code = $1
      `,
        [groupCode]
      );
    } catch (error) {
      console.error("Error getting member vectors:", error);
      throw error;
    }
  }

  static async getMemberCount(groupCode) {
    try {
      const result = await database.query(
        "SELECT COUNT(*) as count FROM group_user WHERE group_code = $1",
        [groupCode]
      );
      return parseInt(result[0].count);
    } catch (error) {
      console.error("Error getting member count:", error);
      throw error;
    }
  }

  static async isMember(groupCode, username) {
    try {
      const result = await database.query(
        "SELECT 1 FROM group_user WHERE group_code = $1 AND username = $2",
        [groupCode, username]
      );
      return result.length > 0;
    } catch (error) {
      console.error("Error checking if user is member:", error);
      throw error;
    }
  }

  static async isCreator(groupCode, username) {
    try {
      const result = await database.query(
        'SELECT 1 FROM "group" WHERE code = $1 AND creator_username = $2',
        [groupCode, username]
      );
      return result.length > 0;
    } catch (error) {
      console.error("Error checking if user is creator:", error);
      throw error;
    }
  }

  static async delete(code) {
    try {
      const result = await database.query(
        'DELETE FROM "group" WHERE code = $1 RETURNING code',
        [code]
      );
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting group:", error);
      throw error;
    }
  }

  static async dissolve(code) {
    try {
      return await this.updateStatus(code, "inactive");
    } catch (error) {
      console.error("Error dissolving group:", error);
      throw error;
    }
  }
}

module.exports = Group;

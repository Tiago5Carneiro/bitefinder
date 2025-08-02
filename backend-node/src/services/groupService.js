const Group = require("../models/Group");
const User = require("../models/User");

class GroupService {
  static generateGroupCode() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  static async createGroup(name, creatorUsername) {
    let code;
    let attempts = 0;
    const maxAttempts = 10;

    // Generate unique code
    do {
      code = this.generateGroupCode();
      const existingGroup = await Group.findByCode(code);
      if (!existingGroup) break;
      attempts++;
    } while (attempts < maxAttempts);

    if (attempts === maxAttempts) {
      throw new Error("Failed to generate unique group code");
    }

    return await Group.create(code, name, creatorUsername);
  }

  static async joinGroup(code, username) {
    const group = await Group.findByCode(code);
    if (!group) {
      throw new Error("Group not found");
    }

    if (group.status !== "active") {
      throw new Error("Group is not accepting new members");
    }

    const memberCount = await Group.getMemberCount(code);
    if (memberCount >= group.max_members) {
      throw new Error("Group is full");
    }

    // Check if user is already a member
    const members = await Group.getMembers(code);
    const isAlreadyMember = members.some(
      (member) => member.username === username
    );
    if (isAlreadyMember) {
      throw new Error("User is already a member of this group");
    }

    await Group.addMember(code, username, false);
    return group;
  }

  static async leaveGroup(code, username) {
    const group = await Group.findByCode(code);
    if (!group) {
      throw new Error("Group not found");
    }

    // If creator leaves, dissolve the group
    if (group.creator_username === username) {
      await Group.updateStatus(code, "inactive");
      return { dissolved: true };
    }

    await Group.removeMember(code, username);
    return { dissolved: false };
  }

  static async updateReadyStatus(code, username, isReady) {
    const group = await Group.findByCode(code);
    if (!group) {
      throw new Error("Group not found");
    }

    await Group.updateMemberReadyStatus(code, username, isReady);

    // Check if all members are ready
    const members = await Group.getMembers(code);
    const allReady =
      members.length > 1 && members.every((member) => member.is_ready);

    if (allReady && group.status === "active") {
      await Group.updateStatus(code, "selecting");
    }

    return { allReady, memberCount: members.length };
  }

  static async getGroupWithMembers(code) {
    const group = await Group.findByCode(code);
    if (!group) {
      throw new Error("Group not found");
    }

    const members = await Group.getMembers(code);
    return { ...group, members };
  }
}

module.exports = GroupService;

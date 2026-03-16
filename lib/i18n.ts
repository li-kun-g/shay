export type Lang = "EN" | "RU" | "KK";

export const LANG_LABEL: Record<Lang, string> = {
  EN: "English",
  RU: "Русский",
  KK: "Қазақша",
};

export type I18nKey =
  | "nav.feed"
  | "nav.events"
  | "nav.myCampus"
  | "nav.groups"
  | "nav.messages"
  | "nav.notifications"
  | "nav.friends"
  | "nav.settings"
  | "auth.login"
  | "auth.signup"
  | "auth.logout"
  | "settings.back"
  | "settings.language.title"
  | "settings.language.subtitle"
  | "settings.language.active"
  | "settings.language.tip"
  | "common.save"
  | "common.loading"
  | "composer.spill"
  | "composer.posting"
  | "composer.placeholder"
  | "composer.open"
  | "composer.removeImage"
  | "composer.photoNonAnonOnly"
  | "composer.anonOn"
  | "composer.anonOff"
  | "composer.left"
  | "composer.photoOnlyNonAnon"
  | "common.close"
  | "common.clear"
  | "cat.gossips"
  | "cat.uni"
  | "cat.confessions"
  | "cat.market"
  | "cat.other"
  | "feed.sort"
  | "feed.sortedByLikes"
  | "feed.category"
  | "feed.visibility"
  | "feed.latest"
  | "feed.topTea"
  | "feed.all"
  | "feed.anon"
  | "feed.nonAnon"
  | "feed.caughtUp"
  | "feed.noPosts"
    | "events.title"
  | "events.create"
  | "events.request"
  | "events.sort.soon"
  | "events.sort.going"
  | "events.sort.new"
  | "events.none"
  | "events.end"
    | "events.going"
  | "events.goingCount"
  | "events.viewAttendees"
  | "events.noOneYet"
  | "events.imageAlt"
  | "common.avatarAlt"
    | "events.request.title"
  | "events.request.subtitle"
  | "events.form.title"
  | "events.form.description"
  | "events.form.locationOptional"
  | "events.request.sending"
  | "events.request.send"
    | "events.new.title"
  | "events.new.imageOptional"
  | "events.new.removeImage"
  | "events.new.changeImage"
  | "events.new.uploading"
  | "events.new.uploadImage"
  | "events.new.imageHint"
  | "events.new.saving"
  | "events.new.publish"
    | "messages.title"
  | "messages.newDm"
  | "messages.newGroup"
  | "messages.administration"
  | "messages.group"
  | "messages.chat"
  | "messages.noMessages"
  | "messages.you"
  | "messages.unknown"
  | "messages.placeholder"
  | "messages.send"
    | "messages.members"
  | "messages.supportHint"
  | "messages.supportEmpty"
  | "messages.emptyThread"
  | "messages.suggested"
  | "messages.friends"
  | "messages.openError"
  | "messages.searchUser"
  | "messages.opening"
  | "messages.openChat"
  | "messages.userNotFound"
  | "messages.cannotDmSelf"
  | "messages.signInAgain"
  | "messages.noResults"
  | "messages.friend"
  | "messages.groupName"
  | "messages.remove"
  | "messages.addPeople"
  | "messages.creating"
  | "messages.createGroup"
    | "notifications.title"
  | "notifications.subtitle"
  | "notifications.unread"
  | "notifications.allCaughtUp"
  | "notifications.marking"
  | "notifications.markAllRead"
  | "notifications.none"
  | "notifications.unreadDot"
  | "notifications.end"
    | "settings.title"
  | "settings.subtitle"
  | "settings.controlCenter"
  | "settings.controlCenterDesc"
  | "settings.profile.title"
  | "settings.profile.desc"
  | "settings.privacy.title"
  | "settings.privacy.desc"
  | "settings.groups.title"
  | "settings.groups.desc"
  | "settings.groups.badge"
  | "settings.groups.pageDesc"
  | "settings.groups.noneTitle"
  | "settings.groups.noneDesc"
  | "settings.groups.rolePresident"
  | "settings.groups.roleAdmin"
  | "settings.groups.everyone"
  | "settings.groups.membersOnly"
  | "settings.groups.tip.before"
  | "settings.groups.tip.bold"
  | "settings.groups.tip.after"
  | "settings.security.title"
  | "settings.security.desc"
  | "settings.language.titleShort"
  | "settings.language.desc"
  | "settings.language.option.en"
  | "settings.language.option.ru"
  | "settings.language.option.kk"
  | "settings.theme.titleShort"
  | "settings.theme.desc"
  | "settings.support.title"
  | "settings.support.desc"
    | "settings.theme.title"
  | "settings.theme.pageDesc"
  | "settings.theme.appearance"
  | "settings.theme.light"
  | "settings.theme.lightDesc"
  | "settings.theme.dark"
  | "settings.theme.darkDesc"
  | "settings.theme.system"
  | "settings.theme.systemDesc"
  | "settings.theme.tip"
  | "settings.support.pageDesc.before"
  | "settings.support.pageDesc.bold"
  | "settings.support.pageDesc.after"
  | "settings.privacy.pageDesc"
  | "settings.privacy.friendsList.title"
  | "settings.privacy.friendsList.desc"
  | "settings.privacy.groups.title"
  | "settings.privacy.groups.desc"
  | "settings.privacy.dm.title"
  | "settings.privacy.dm.desc"
  | "settings.privacy.save"
  | "settings.option.onlyMe"
  | "settings.option.friends"
  | "settings.option.everyone"
  | "settings.option.friendsOnly"
  | "settings.profile.editTitle"
  | "settings.profile.editDesc"
  | "settings.profile.previewAlt"
  | "settings.profile.campusTitle"
  | "settings.profile.campusDesc"
  | "settings.profile.visibleTo"
  | "settings.profile.expiresIn"
  | "settings.profile.duration2h"
  | "settings.profile.duration4h"
  | "settings.profile.durationEod"
  | "settings.profile.statusPlaceholder"
  | "settings.profile.majorPlaceholder"
  | "settings.profile.yearPlaceholder"
  | "settings.profile.emojiPlaceholder"
  | "settings.profile.saveChanges"
  | "settings.profile.saving"
  | "settings.profile.college.bcb"
  | "settings.profile.college.css"
  | "settings.profile.college.law"
  | "settings.profile.college.he"
  | "settings.profile.college.mcs"
  | "settings.profile.college.other"
    | "friends.title"
  | "friends.requests"
  | "friends.noRequests"
  | "friends.accept"
  | "friends.decline"
  | "friends.myFriends"
  | "friends.noFriendsYet"
  | "friends.findPeople"
  | "friends.searchUsersPlaceholder"
  | "friends.friends"
  | "friends.requested"
  | "friends.requestedYou"
  | "friends.add"
  | "friends.noUsersFound"
  | "friends.searchFriendsPlaceholder"
  | "friends.all"
  | "friends.onCampus"
  | "friends.offCampus"
  | "friends.shown"
  | "friends.noMatches"
  | "friends.remove"
    | "friends.requestSent"
  | "friends.cancel"
  | "friends.you"
    | "groups.title"
  | "groups.subtitle"
  | "groups.requestOfficial"
  | "groups.noneApproved"
  | "groups.members"
  | "groups.followers"
  | "groups.requestSent"
  | "groups.requestPending.before"
  | "groups.requestPending.bold"
  | "groups.requestPending.after"
  | "groups.requestTitle"
  | "groups.requestDesc"
  | "groups.form.name"
  | "groups.form.slug"
  | "groups.form.description"
  | "groups.form.image"
  | "groups.tip.before"
  | "groups.tip.example"
  | "groups.sending"
  | "groups.sendRequest"
  | "groups.createTitle"
  | "groups.create.name"
  | "groups.create.description"
  | "groups.create.public"
  | "groups.create.private"
  | "groups.creating"
  | "groups.create"
    | "group.president"
  | "group.tab.about"
  | "group.tab.events"
  | "group.tab.members"
  | "group.aboutTitle"
  | "group.aboutDesc"
  | "group.eventCreated"
  | "group.eventsTitle"
  | "group.eventsDesc"
  | "group.membersPrivate"
  | "group.signInToJoin"
  | "group.requestToSeeMembers"
  | "group.membershipRequests"
  | "group.membershipRequestsDesc"
  | "group.visibleToMembers"
  | "group.noMembersYet"
  | "common.edit"
    | "group.editTitle"
  | "group.back"
  | "group.avatar"
  | "group.avatarAlt"
  | "group.noPhoto"
  | "group.avatarTip"
  | "group.form.nameLabel"
  | "group.form.namePlaceholder"
  | "group.form.descLabel"
  | "group.form.descPlaceholder"
    | "profile.alt"
  | "profile.student"
  | "profile.undeclared"
  | "profile.year"
  | "profile.editProfile"
  | "profile.posts"
  | "profile.friendsPrivate"
  | "profile.groupsPrivate"
  | "profile.onlyFriendsCanView"
  | "campus.justNow"
  | "campus.oneMinuteAgo"
  | "campus.minutesAgoShort"
  | "campus.noStatus"
  | "campus.on"
  | "campus.off"
  | "common.clear"
   | "profile.addFriend"
  | "profile.acceptFriend"
  | "profile.messageFriendsOnly"
  | "profile.messageError"
  | "messages.message"
    | "comments.title"
  | "comments.none"
  | "comments.deleteTitle"
  | "comments.deleteDesc"
  | "comments.deleteConfirm"
  | "comments.deleteOne"
  | "comments.anonymousOn"
  | "comments.anonymousOff"
  | "comments.signInToReply"
  | "comments.replyPlaceholder"
  | "comments.sending"
  | "common.anonymous"
  | "common.you"
  | "common.send"
  | "common.no"
  | "post.title"
| "post.openedFromNotification"
| "comments.sectionTitle"
| "groups.follow"
| "groups.following"
| "groups.requestToJoin"
| "groups.youAreMember"
| "composer.open"
| "composer.spill"
| "composer.placeholder"
| "composer.removePhoto"
| "composer.photoNonAnonOnly"
| "composer.anonymousOn"
| "composer.anonymousOff"
| "composer.left"
| "composer.posting"
| "messages.inputPlaceholder"
| "messages.send"
| "messages.sending"
| "messages.unread"
| "messages.message"
| "messages.inputPlaceholder"
| "messages.sending"
| "messages.send"
| "messages.userNotFound"
| "messages.cannotDmSelf"
| "messages.friendsOnly"
| "messages.signInAgain"
| "messages.tryAgain"
| "messages.suggested"
| "messages.newDm"
| "messages.newGroup"
| "messages.administration"
| "messages.group"
| "messages.members"
| "messages.supportHint"
| "messages.supportEmpty"
| "messages.noMessagesYet"
| "messages.groupName"
| "messages.groupMembersLimit"
| "messages.addPeople"
| "messages.creating"
| "messages.createGroup"
| "common.remove"
| "common.noResults"
| "friends.friend"
| "friends.addFriend"
| "common.cancel"
| "comments.deleteDescription"
| "comments.empty"
| "comments.delete"
| "common.sending"
| "common.done"
| "composer.sentToModeration"
| "composer.moderationDesc"

const DICTS: Record<Lang, Record<I18nKey, string>> = {
  EN: {
    "nav.feed": "Feed",
    "nav.events": "Events",
    "nav.myCampus": "My Campus",
    "nav.groups": "Groups",
    "nav.messages": "Messages",
    "nav.notifications": "Notifications",
    "nav.friends": "Friends",
    "nav.settings": "Settings",
    "auth.login": "Log in",
    "auth.signup": "Sign up",
    "auth.logout": "Log out",
    "settings.back": "← Back to Settings",
    "settings.language.title": "Language",
    "settings.language.subtitle": "Choose the language for KIMEPish.",
    "settings.language.active": "Active",
    "settings.language.tip": "This changes the interface language.",
    "common.save": "Save",
    "common.loading": "Loading…",
    "composer.spill": "Spill",
    "composer.posting": "Posting...",
    "composer.placeholder": "What’s the tea at KIMEP today? ☕",
    "composer.open": "Open Spill Composer",
    "composer.removeImage": "Remove image",
    "composer.photoNonAnonOnly": "Photos work only for non-anonymous posts",
    "composer.anonOn": "Anonymous ✅",
    "composer.anonOff": "Anonymous ❌",
    "composer.left": "left",
    "composer.photoOnlyNonAnon": "Photos are available only for non-anonymous posts",
    "common.close": "Close",
    "common.clear": "Clear",
    "cat.gossips": "Shai gossips",
    "cat.uni": "Uni stuff",
    "cat.confessions": "Confessions",
    "cat.market": "Market",
    "cat.other": "Other",
    "feed.sort": "Sort",
    "feed.sortedByLikes": "Sorted by likes",
    "feed.category": "Category",
    "feed.visibility": "Visibility",
    "feed.latest": "Latest",
"feed.topTea": "Top Tea",
"feed.all": "All",
"feed.anon": "Anon",
"feed.nonAnon": "Non-anon",
"feed.caughtUp": "You’re all caught up.",
"feed.noPosts": "No posts yet.",
"events.title": "Events",
"events.create": "Create event",
"events.request": "Request event",
"events.sort.soon": "Soonest",
"events.sort.going": "Most going",
"events.sort.new": "Newest",
"events.none": "No events yet.",
"events.end": "You reached the end.",
"events.going": "Going",
"events.goingCount": "going",
"events.viewAttendees": "View attendees",
"events.noOneYet": "No one yet.",
"events.imageAlt": "Event",
"common.avatarAlt": "avatar",
"events.request.title": "Request an event",
"events.request.subtitle": "Only official / group accounts can publish events. Your request will be reviewed.",
"events.form.title": "Title",
"events.form.description": "Description",
"events.form.locationOptional": "Location (optional)",
"events.request.sending": "Sending…",
"events.request.send": "Send request",
"events.new.title": "Create event",
"events.new.imageOptional": "Event image (optional)",
"events.new.removeImage": "Remove image",
"events.new.changeImage": "Change",
"events.new.uploading": "Uploading…",
"events.new.uploadImage": "Upload image",
"events.new.imageHint": "One image, up to 4MB. (Optional)",
"events.new.saving": "Saving…",
"events.new.publish": "Publish",
"messages.title": "Messages",
"messages.newDm": "New DM",
"messages.newGroup": "New Group",
"messages.administration": "Administration",
"messages.group": "Group",
"messages.chat": "Chat",
"messages.noMessages": "No messages yet",
"messages.you": "You",
"messages.unknown": "unknown",
"messages.placeholder": "Message…",
"messages.send": "Send",
"messages.members": "Members",
"messages.supportHint": "Contact KIMEPish administration for reports, suggestions, and complaints.",
"messages.supportEmpty": "Describe your issue or suggestion — we’ll respond soon.",
"messages.emptyThread": "No messages yet. Say hi 👋",
"messages.suggested": "Suggested",
"messages.friends": "Friends",
"messages.openError": "Could not open chat. Try again.",
"messages.searchUser": "Search by name or username",
"messages.opening": "Opening…",
"messages.openChat": "Open chat",
"messages.userNotFound": "User not found.",
"messages.cannotDmSelf": "You can’t DM yourself.",
"messages.signInAgain": "Please sign in again.",
"messages.noResults": "No results.",
"messages.friend": "Friend",
"messages.groupName": "Group name",
"messages.remove": "Remove",
"messages.addPeople": "Add people (search by name or username)",
"messages.creating": "Creating…",
"messages.createGroup": "Create group",
"notifications.title": "Notifications",
"notifications.subtitle": "Updates about friends, posts, events, and your account.",
"notifications.unread": "unread",
"notifications.allCaughtUp": "All caught up",
"notifications.marking": "Marking...",
"notifications.markAllRead": "Mark all as read",
"notifications.none": "No notifications yet.",
"notifications.unreadDot": "Unread",
"notifications.end": "End of notifications.",
"settings.title": "Settings",
"settings.subtitle": "All your settings in one place.",
"settings.controlCenter": "Your control center",
"settings.controlCenterDesc": "There will be some updates soon, but for now, you can manage your profile, privacy settings, and more.",

"settings.profile.title": "Profile",
"settings.profile.desc": "Edit your profile, campus preferences, and personal info.",

"settings.privacy.title": "Privacy (Account)",
"settings.privacy.desc": "Control who can see your friends list, groups, and who can message you.",

"settings.groups.title": "Group Privacy",
"settings.groups.desc": "Manage group member list visibility for groups you own or administrate.",
"settings.groups.badge": "Owners/Admins",
"settings.groups.pageDesc": "Control who can view your group members list (per group).",
"settings.groups.noneTitle": "No managed groups",
"settings.groups.noneDesc": "You’ll see groups here if you are a President or Admin.",
"settings.groups.rolePresident": "President",
"settings.groups.roleAdmin": "Admin",
"settings.groups.everyone": "Everyone can view members",
"settings.groups.membersOnly": "Members only",
"settings.groups.tip.before": "Tip: If you choose",
"settings.groups.tip.bold": "Members only",
"settings.groups.tip.after": ", non-members will see a private message.",

"settings.security.title": "Security",
"settings.security.desc": "Change your password and keep your account secure.",

"settings.language.titleShort": "Language",
"settings.language.desc": "Choose your app language (English, Русский, Қазақша).",
"settings.language.option.en": "English",
"settings.language.option.ru": "Russian",
"settings.language.option.kk": "Kazakh",

"settings.theme.titleShort": "Theme",
"settings.theme.desc": "Switch between Light and Dark mode.",

"settings.support.title": "Support",
"settings.support.desc": "Open your support chat with KIMEPish for reports, suggestions, and complaints.",
"settings.theme.title": "Theme",
"settings.theme.pageDesc": "Customize the look of KIMEPish.",
"settings.theme.appearance": "Appearance",
"settings.theme.light": "Light",
"settings.theme.lightDesc": "Clean, bright look",
"settings.theme.dark": "Dark",
"settings.theme.darkDesc": "Easy on the eyes at night",
"settings.theme.system": "System",
"settings.theme.systemDesc": "Match your device setting",
"settings.theme.tip": "Tip: Use Dark mode if your id is odd. Just kidding, choose what you like!",

"settings.support.pageDesc.before": "Report bugs, send suggestions, or ask for help. You will have",
"settings.support.pageDesc.bold": "one",
"settings.support.pageDesc.after": "permanent chat with the KIMEPish administration.",

"settings.privacy.pageDesc": "Control what people can see and who can contact you.",
"settings.privacy.friendsList.title": "Who can see my friends list",
"settings.privacy.friendsList.desc": "Choose whether everyone or only friends can see your friends list.",
"settings.privacy.groups.title": "Who can see my groups",
"settings.privacy.groups.desc": "Control visibility of groups shown on your profile.",
"settings.privacy.dm.title": "Who can message me",
"settings.privacy.dm.desc": "Allow direct messages from everyone or friends only.",
"settings.privacy.save": "Save privacy settings",

"settings.option.onlyMe": "Only me",
"settings.option.friends": "Friends",
"settings.option.everyone": "Everyone",
"settings.option.friendsOnly": "Friends only",

"settings.profile.editTitle": "Edit profile",
"settings.profile.editDesc": "Uploading a photo won’t change your profile until you click Save.",
"settings.profile.previewAlt": "Profile preview",
"settings.profile.campusTitle": "Campus status settings",
"settings.profile.campusDesc": "These will be used when you toggle your campus status.",
"settings.profile.visibleTo": "Visible to:",
"settings.profile.expiresIn": "Expires in:",
"settings.profile.duration2h": "2 hours",
"settings.profile.duration4h": "4 hours",
"settings.profile.durationEod": "Until end of day",
"settings.profile.statusPlaceholder": "Status (max 80 chars)",
"settings.profile.majorPlaceholder": "Major",
"settings.profile.yearPlaceholder": "Year of study (1–4)",
"settings.profile.emojiPlaceholder": "Emoji",
"settings.profile.saveChanges": "Save changes",
"settings.profile.saving": "Saving…",
"settings.profile.college.bcb": "Bang College of Business",
"settings.profile.college.css": "College of Social Sciences",
"settings.profile.college.law": "School of Law",
"settings.profile.college.he": "School of Humanities and Education",
"settings.profile.college.mcs": "School of Mathematics and Computer Science",
"settings.profile.college.other": "Other",
"friends.title": "Friends",
"friends.requests": "Requests",
"friends.noRequests": "No requests",
"friends.accept": "Accept",
"friends.decline": "Decline",
"friends.myFriends": "My friends",
"friends.noFriendsYet": "No friends yet",
"friends.findPeople": "Find people",
"friends.searchUsersPlaceholder": "Search by username… (e.g. batman or @batman)",
"friends.friends": "Friends",
"friends.requested": "Requested",
"friends.requestedYou": "Requested you",
"friends.add": "Add",
"friends.noUsersFound": "No users found.",
"friends.searchFriendsPlaceholder": "Search friends… (e.g. @dais)",
"friends.all": "All",
"friends.onCampus": "On campus",
"friends.offCampus": "Off campus",
"friends.shown": "shown",
"friends.noMatches": "No matches",
"friends.remove": "Remove",
"friends.requestSent": "Request sent",
"friends.cancel": "Cancel",
"friends.you": "You",
"groups.title": "Groups",
"groups.subtitle": "Only official KIMEP organizations are shown right now.",
"groups.requestOfficial": "Request official group",
"groups.noneApproved": "No approved groups yet.",
"groups.members": "members",
"groups.followers": "followers",

"groups.requestSent": "Request sent",
"groups.requestPending.before": "Your group request is now",
"groups.requestPending.bold": "pending approval",
"groups.requestPending.after": "We’ll review it and publish the group once approved.",

"groups.requestTitle": "Request a group",
"groups.requestDesc": "Anyone can request. After approval, the group becomes official and can publish events.",
"groups.form.name": "Group name (e.g., KIMEP Times)",
"groups.form.slug": "Slug (e.g., kimeptimes)",
"groups.form.description": "Short description (optional)",
"groups.form.image": "Logo URL (optional)",
"groups.tip.before": "Tip: keep slug lowercase, no spaces. Example:",
"groups.tip.example": "artrevolution",
"groups.sending": "Sending…",
"groups.sendRequest": "Send request",

"groups.createTitle": "Create group",
"groups.create.name": "Group name",
"groups.create.description": "Description (optional)",
"groups.create.public": "Public (anyone can join)",
"groups.create.private": "Private (we’ll add requests later)",
"groups.creating": "Creating…",
"groups.create": "Create",
"group.president": "President",
"group.tab.about": "About",
"group.tab.events": "Events",
"group.tab.members": "Members",
"group.aboutTitle": "About",
"group.aboutDesc": "This is an official group page",
"group.eventCreated": "Event created.",
"group.eventsTitle": "Events",
"group.eventsDesc": "Official group events will be shown here.",
"group.membersPrivate": "Members list is private. Only members can view it.",
"group.signInToJoin": "Sign in to request to join.",
"group.requestToSeeMembers": "Request to join the group to see members.",
"group.membershipRequests": "Membership requests",
"group.membershipRequestsDesc": "Approve or reject membership requests.",
"group.visibleToMembers": "Visible to members",
"group.noMembersYet": "No members yet.",
"common.edit": "Edit",
"group.editTitle": "Edit group",
"group.back": "Back",
"group.avatar": "Group avatar",
"group.avatarAlt": "Group avatar",
"group.noPhoto": "No photo",
"group.avatarTip": "Tip: use a square image for best look.",
"group.form.nameLabel": "Group name",
"group.form.namePlaceholder": "Group name",
"group.form.descLabel": "Short description (optional)",
"group.form.descPlaceholder": "What is this group about?",
"profile.alt": "Profile",
"profile.student": "Student",
"profile.undeclared": "Undeclared",
"profile.year": "Year",
"profile.editProfile": "Edit profile",
"profile.posts": "Posts",
"profile.friendsPrivate": "Friends list is private",
"profile.groupsPrivate": "Groups list is private",
"profile.onlyFriendsCanView": "Only friends can view this list.",

"campus.justNow": "just now",
"campus.oneMinuteAgo": "1m ago",
"campus.minutesAgoShort": "m ago",
"campus.noStatus": "No campus status",
"campus.on": "On campus",
"campus.off": "Off campus",
"profile.addFriend": "Add friend",
"profile.acceptFriend": "Accept friend",
"profile.messageFriendsOnly": "This user only allows messages from friends.",
"profile.messageError": "Could not open a chat right now. Please try again.",
"messages.message": "Message",
"comments.title": "Tea replies",
"comments.none": "No replies yet. Spill first ☕",
"comments.deleteTitle": "Delete this reply?",
"comments.deleteDesc": "This will permanently remove your reply.",
"comments.deleteConfirm": "Yes, delete",
"comments.deleteOne": "Delete reply",
"comments.anonymousOn": "Anonymous ✅",
"comments.anonymousOff": "Anonymous ❌",
"comments.signInToReply": "Sign in to reply",
"comments.replyPlaceholder": "Reply with tea…",
"comments.sending": "Sending...",
"common.anonymous": "Anonymous",
"common.you": "You",
"common.send": "Send",
"common.no": "No",
"post.title": "Post",
"post.openedFromNotification": "Opened from notification",
"comments.sectionTitle": "Comments",
"groups.follow": "Follow",
"groups.following": "Following",
"groups.requestToJoin": "Request to join",
"groups.youAreMember": "You are a member",
"composer.removePhoto": "Remove photo",
"composer.anonymousOn": "Anonymous ✅",
"composer.anonymousOff": "Anonymous ❌",
"messages.inputPlaceholder": "Message…",
"messages.sending": "Sending...",
"messages.unread": "Unread",
"messages.friendsOnly": "This user only allows messages from friends.",
"messages.tryAgain": "Could not send message. Please try again.",
"messages.noMessagesYet": "No messages yet.",
"messages.groupMembersLimit": "Members limit:",
"common.remove": "Remove",
"common.noResults": "No results.",
"friends.friend": "Friend",
"friends.addFriend": "Add friend",
"common.cancel": "Cancel",
"comments.deleteDescription": "This will permanently remove your reply.",
"comments.empty": "No replies yet. Spill first ☕",
"comments.delete": "Delete reply",
"common.sending": "Sending...",
"common.done": "Done",
    "composer.sentToModeration": "Your post sent for moderation",
    "composer.moderationDesc": "It will appear on the feed once it has been approved by the team!",
  },
  RU: {
    "nav.feed": "Лента",
    "nav.events": "Ивенты",
    "nav.myCampus": "Мой кампус",
    "nav.groups": "Группы",
    "nav.messages": "Сообщения",
    "nav.notifications": "Уведомления",
    "nav.friends": "Друзья",
    "nav.settings": "Настройки",
    "auth.login": "Войти",
    "auth.signup": "Регистрация",
    "auth.logout": "Выйти",
    "settings.back": "← Назад в настройки",
    "settings.language.title": "Язык",
    "settings.language.subtitle": "Выберите язык интерфейса KIMEPish.",
    "settings.language.active": "Активный",
    "settings.language.tip": "Системный язык по умолчанию — английский.",
    "common.save": "Сохранить",
    "common.loading": "Загрузка…",
    "composer.spill": "Опубликовать",
    "composer.posting": "Публикация...",
    "composer.placeholder": "Что нового в KIMEP сегодня? ☕",
    "composer.open": "Открыть создание поста",
    "composer.removeImage": "Удалить фото",
    "composer.photoNonAnonOnly": "Фото доступно только для неанонимных постов",
    "composer.anonOn": "Анонимно ✅",
    "composer.anonOff": "Анонимно ❌",
    "composer.left": "осталось",
    "composer.photoOnlyNonAnon": "Фото доступно только для неанонимных постов",
    "common.close": "Закрыть",
    "common.clear": "Очистить",
    "cat.gossips": "Молва",
    "cat.uni": "Академ",
    "cat.confessions": "Признания",
    "cat.market": "Маркет",
    "cat.other": "Другое",
    "feed.sort": "Сортировка",
    "feed.sortedByLikes": "Сортировка по лайкам",
    "feed.category": "Категория",
    "feed.visibility": "Видимость",
    "feed.latest": "Свежие",
"feed.topTea": "Топ ☕",
"feed.all": "Все",
"feed.anon": "Анон",
"feed.nonAnon": "Не анон",
"feed.caughtUp": "Вы всё просмотрели.",
"feed.noPosts": "Постов пока нет.",
"events.title": "Ивенты",
"events.create": "Создать ивент",
"events.request": "Запросить ивент",
"events.sort.soon": "Скоро",
"events.sort.going": "Самые популярити",
"events.sort.new": "Новые",
"events.none": "Пока нет ивентов.",
"events.end": "Вы дошли до конца.",
"events.going": "Иду",
"events.goingCount": "идут",
"events.viewAttendees": "Посмотреть участников",
"events.noOneYet": "Пока никого нет.",
"events.imageAlt": "Ивент",
"common.avatarAlt": "аватар",
"events.request.title": "Запросить ивент",
"events.request.subtitle": "Только официальные / групповые аккаунты могут публиковать ивенты. Ваш запрос будет рассмотрен.",
"events.form.title": "Название",
"events.form.description": "Описание",
"events.form.locationOptional": "Локация (необязательно)",
"events.request.sending": "Отправка…",
"events.request.send": "Отправить запрос",
"events.new.title": "Создать ивент",
"events.new.imageOptional": "Изображение ивента (необязательно)",
"events.new.removeImage": "Удалить изображение",
"events.new.changeImage": "Изменить",
"events.new.uploading": "Загрузка…",
"events.new.uploadImage": "Загрузить изображение",
"events.new.imageHint": "Одно изображение, до 4MB. (Необязательно)",
"events.new.saving": "Сохранение…",
"events.new.publish": "Опубликовать",
"messages.title": "Сообщения",
"messages.newDm": "Новый DM",
"messages.newGroup": "Новая группа",
"messages.administration": "Администрация",
"messages.group": "Группа",
"messages.chat": "Чат",
"messages.noMessages": "Пока нет сообщений",
"messages.you": "Вы",
"messages.unknown": "неизвестно",
"messages.placeholder": "Сообщение…",
"messages.send": "Отправить",
"messages.members": "Участники",
"messages.supportHint": "Свяжитесь с администрацией KIMEPish для жалоб, предложений и обращений.",
"messages.supportEmpty": "Опишите вашу проблему или предложение, мы скоро ответим.",
"messages.emptyThread": "Пока нет сообщений. Скажите привет 👋",
"messages.suggested": "Рекомендуемые",
"messages.friends": "Друзья",
"messages.openError": "Не удалось открыть чат. Попробуйте снова.",
"messages.searchUser": "Поиск по имени или нику, ю но",
"messages.opening": "Открытие…",
"messages.openChat": "Открыть чат",
"messages.userNotFound": "Пользователь не найден.",
"messages.cannotDmSelf": "Нельзя писать самому себе.",
"messages.signInAgain": "Пожалуйста, войдите снова.",
"messages.noResults": "Ничего не найдено.",
"messages.friend": "Друг",
"messages.groupName": "Название группы",
"messages.remove": "Убрать",
"messages.addPeople": "Добавьте людей (поиск по имени или нику)",
"messages.creating": "Создание…",
"messages.createGroup": "Создать группу",
"notifications.title": "Уведомления",
"notifications.subtitle": "Обновления о друзьях, постах, ивентах и вашем аккаунте.",
"notifications.unread": "непрочитанных",
"notifications.allCaughtUp": "Всё просмотрено",
"notifications.marking": "Отмечаем...",
"notifications.markAllRead": "Отметить всё как прочитанное",
"notifications.none": "Пока нет уведомлений.",
"notifications.unreadDot": "Непрочитано",
"notifications.end": "Конец уведомлений.",
"settings.title": "Настройки",
"settings.subtitle": "Конфиденциальность, безопасность, язык, тема и поддержка — всё в одном месте.",
"settings.controlCenter": "Ваш центр управления",
"settings.controlCenterDesc": "Скоро появятся новые обновления, а пока вы можете управлять профилем, настройками приватности и другим.",

"settings.profile.title": "Профиль",
"settings.profile.desc": "Редактируйте профиль, настройки кампуса и личную информацию.",

"settings.privacy.title": "Приватность (Аккаунт)",
"settings.privacy.desc": "Управляйте тем, кто видит список друзей, группы и кто может вам писать.",

"settings.groups.title": "Приватность групп",
"settings.groups.desc": "Настройте видимость списка участников для групп, которыми вы владеете или управляете.",
"settings.groups.badge": "Владельцы/Админы",
"settings.groups.pageDesc": "Управляйте тем, кто может видеть список участников вашей группы (для каждой группы отдельно).",
"settings.groups.noneTitle": "Нет управляемых групп",
"settings.groups.noneDesc": "Группы появятся здесь, если вы Президент или Админ.",
"settings.groups.rolePresident": "Президент",
"settings.groups.roleAdmin": "Админ",
"settings.groups.everyone": "Все могут видеть участников",
"settings.groups.membersOnly": "Только участники",
"settings.groups.tip.before": "Совет: если выбрать",
"settings.groups.tip.bold": "Только участники",
"settings.groups.tip.after": ", не-участники увидят приватное сообщение.",

"settings.security.title": "Безопасность",
"settings.security.desc": "Измените пароль и защитите свой аккаунт.",

"settings.language.titleShort": "Язык",
"settings.language.desc": "Выберите язык приложения (English, Русский, Қазақша).",
"settings.language.option.en": "Английский",
"settings.language.option.ru": "Русский",
"settings.language.option.kk": "Казахский",

"settings.theme.titleShort": "Тема",
"settings.theme.desc": "Переключайтесь между светлой и тёмной темой.",

"settings.support.title": "Поддержка",
"settings.support.desc": "Откройте чат поддержки KIMEPish для жалоб, предложений и обращений.",
"settings.theme.title": "Тема",
"settings.theme.pageDesc": "Настройте свой вайб с KIMEPish.",
"settings.theme.appearance": "Оформление",
"settings.theme.light": "Светлая",
"settings.theme.lightDesc": "Чистый и яркий вид",
"settings.theme.dark": "Тёмная",
"settings.theme.darkDesc": "Комфортна для глаз ночью",
"settings.theme.system": "Системная",
"settings.theme.systemDesc": "Следует по настройке устройства",
"settings.theme.tip": "Интересный факт: Обычно фрэшки ставят темную тему.",

"settings.support.pageDesc.before": "Сообщайте об ошибках, отправляйте предложения или просите помощь. У вас будет",
"settings.support.pageDesc.bold": "один",
"settings.support.pageDesc.after": "постоянный чат с администрацией KIMEPish.",

"settings.privacy.pageDesc": "Управляйте тем, что люди могут видеть и кто может с вами связываться.",
"settings.privacy.friendsList.title": "Кто может видеть мой список друзей",
"settings.privacy.friendsList.desc": "Выберите, будет ли список друзей виден всем или только друзьям.",
"settings.privacy.groups.title": "Кто может видеть мои группы",
"settings.privacy.groups.desc": "Управляйте видимостью групп в вашем профиле.",
"settings.privacy.dm.title": "Кто может мне писать",
"settings.privacy.dm.desc": "Разрешите личные сообщения от всех или только от друзей.",
"settings.privacy.save": "Сохранить настройки приватности",

"settings.option.onlyMe": "Только я",
"settings.option.friends": "Друзья",
"settings.option.everyone": "Все",
"settings.option.friendsOnly": "Только друзья",

"settings.profile.editTitle": "Редактировать профиль",
"settings.profile.editDesc": "Загрузка фото не изменит профиль, пока вы не нажмёте Сохранить.",
"settings.profile.previewAlt": "Превью профиля",
"settings.profile.campusTitle": "Настройки статуса кампуса",
"settings.profile.campusDesc": "Они будут использоваться, когда вы переключаете статус кампуса.",
"settings.profile.visibleTo": "Видно для:",
"settings.profile.expiresIn": "Истекает через:",
"settings.profile.duration2h": "2 часа",
"settings.profile.duration4h": "4 часа",
"settings.profile.durationEod": "До конца дня",
"settings.profile.statusPlaceholder": "Статус (макс. 80 символов)",
"settings.profile.majorPlaceholder": "Мейджор",
"settings.profile.yearPlaceholder": "Год обучения (1–4)",
"settings.profile.emojiPlaceholder": "Эмодзи",
"settings.profile.saveChanges": "Сохранить изменения",
"settings.profile.saving": "Сохранение…",
"settings.profile.college.bcb": "Bang College of Business",
"settings.profile.college.css": "College of Social Sciences",
"settings.profile.college.law": "School of Law",
"settings.profile.college.he": "School of Humanities and Education",
"settings.profile.college.mcs": "School of Mathematics and Computer Science",
"settings.profile.college.other": "Другое",
"friends.title": "Друзья",
"friends.requests": "Запросы",
"friends.noRequests": "Нет запросов",
"friends.accept": "Принять",
"friends.decline": "Отклонить",
"friends.myFriends": "Мои друзья",
"friends.noFriendsYet": "Пока нет друзей",
"friends.findPeople": "Найти людей",
"friends.searchUsersPlaceholder": "Поиск по нику… (например, batman или @batman)",
"friends.friends": "Друзья",
"friends.requested": "Отправлено",
"friends.requestedYou": "Хотят дружить:3",
"friends.add": "Добавить",
"friends.noUsersFound": "Пользователи не найдены.",
"friends.searchFriendsPlaceholder": "Поиск друзей… (например, @dais)",
"friends.all": "Все",
"friends.onCampus": "На кампусе",
"friends.offCampus": "Не на кампусе",
"friends.shown": "показано",
"friends.noMatches": "Совпадений нет",
"friends.remove": "Удалить",
"friends.requestSent": "Запрос отправлен",
"friends.cancel": "Отменить",
"friends.you": "Вы",
"groups.title": "Группы",
"groups.subtitle": "Сейчас показываются только официальные организации KIMEP.",
"groups.requestOfficial": "Запросить официальную группу",
"groups.noneApproved": "Пока нет одобренных групп.",
"groups.members": "мемберов",
"groups.followers": "подписчиков",

"groups.requestSent": "Запрос отправлен",
"groups.requestPending.before": "Ваш запрос на группу сейчас",
"groups.requestPending.bold": "ожидает одобрения",
"groups.requestPending.after": "Мы рассмотрим его и опубликуем группу после одобрения.",

"groups.requestTitle": "Запросить группу",
"groups.requestDesc": "Любой может отправить запрос. После одобрения группа станет официальной и сможет публиковать ивенты.",
"groups.form.name": "Название группы (например, TEDxKIMEP)",
"groups.form.slug": "Slug (например, tedxkimep)",
"groups.form.description": "Короткое описание (необязательно)",
"groups.form.image": "URL логотипа (необязательно)",
"groups.tip.before": "Совет: slug должен быть в нижнем регистре, без пробелов. Пример:",
"groups.tip.example": "kimepfriends",
"groups.sending": "Отправка…",
"groups.sendRequest": "Отправить запрос",

"groups.createTitle": "Создать группу",
"groups.create.name": "Название группы",
"groups.create.description": "Описание (необязательно)",
"groups.create.public": "Публичная (любой может вступить)",
"groups.create.private": "Приватная (запросы добавим позже)",
"groups.creating": "Создание…",
"groups.create": "Создать",
"group.president": "Президент",
"group.tab.about": "О группе",
"group.tab.events": "Ивенты",
"group.tab.members": "мемберы",
"group.aboutTitle": "О группе",
"group.aboutDesc": "Это официальная страница группы.",
"group.eventCreated": "Ивент создан.",
"group.eventsTitle": "Ивенты",
"group.eventsDesc": "Здесь будут показаны официальные ивенты группы.",
"group.membersPrivate": "Список мемберов приватный. Его могут видеть только участники.",
"group.signInToJoin": "Войдите, чтобы отправить запрос на вступление.",
"group.requestToSeeMembers": "Отправьте запрос на вступление в группу, чтобы видеть участников.",
"group.membershipRequests": "Запросы на вступление",
"group.membershipRequestsDesc": "Одобрите или отклоните запросы на вступление.",
"group.visibleToMembers": "Видно участникам",
"group.noMembersYet": "Пока нет мемберов.",
"common.edit": "Редактировать",
"group.editTitle": "Редачить группу",
"group.back": "Назад",
"group.avatar": "Аватар группы",
"group.avatarAlt": "Аватар группы",
"group.noPhoto": "Нет фото",
"group.avatarTip": "Совет: используйте квадратное изображение для лучшего вида.",
"group.form.nameLabel": "Название группы",
"group.form.namePlaceholder": "Название группы",
"group.form.descLabel": "Короткое описание (необязательно)",
"group.form.descPlaceholder": "О чём эта группа?",
"profile.alt": "Профиль",
"profile.student": "Студент",
"profile.undeclared": "Не указано",
"profile.year": "Курс",
"profile.editProfile": "Редактировать профиль",
"profile.posts": "Посты",
"profile.friendsPrivate": "Список друзей приватный",
"profile.groupsPrivate": "Список групп приватный",
"profile.onlyFriendsCanView": "Только истинные хоумиз могут видеть этот список.",

"campus.justNow": "только что",
"campus.oneMinuteAgo": "1м назад",
"campus.minutesAgoShort": "м назад",
"campus.noStatus": "Нет статуса кампуса",
"campus.on": "На кампусе",
"campus.off": "Не на кампусе",
"profile.addFriend": "Добавить в друзья",
"profile.acceptFriend": "Принять в друзья",
"profile.messageFriendsOnly": "Этот пользователь принимает сообщения только от друзей.",
"profile.messageError": "Не удалось открыть чат. Попробуйте ещё раз.",
"messages.message": "Сообщение",
"comments.title": "Ответы",
"comments.none": "Пока нет ответов. Напиши первым ☕",
"comments.deleteTitle": "Удалить этот ответ?",
"comments.deleteDesc": "Этот ответ будет удалён навсегда.",
"comments.deleteConfirm": "Да, удалить",
"comments.deleteOne": "Удалить ответ",
"comments.anonymousOn": "Анонимно ✅",
"comments.anonymousOff": "Анонимно ❌",
"comments.signInToReply": "Войдите, чтобы ответить",
"comments.replyPlaceholder": "Ответить…",
"comments.sending": "Отправка...",
"common.anonymous": "Анонимно",
"common.you": "Вы",
"common.send": "Отправить",
"common.no": "Нет",
"post.title": "Пост",
"post.openedFromNotification": "Открыто из уведомления",
"comments.sectionTitle": "Комментарии",
"groups.follow": "Подписаться",
"groups.following": "Вы подписаны",
"groups.requestToJoin": "Запросить вступление",
"groups.youAreMember": "Вы участник",
"composer.removePhoto": "Удалить фото",
"composer.anonymousOn": "Анонимно ✅",
"composer.anonymousOff": "Анонимно ❌",
"messages.inputPlaceholder": "Сообщение…",
"messages.sending": "Отправка...",
"messages.unread": "Непрочитано",
"messages.friendsOnly": "Этот пользователь принимает сообщения только от друзей.",
"messages.tryAgain": "Не удалось отправить сообщение. Попробуйте ещё раз.",
"messages.noMessagesYet": "Пока нет сообщений.",
"messages.groupMembersLimit": "Лимит участников:",
"common.remove": "Удалить",
"common.noResults": "Ничего не найдено.",
"friends.friend": "Друг",
"friends.addFriend": "Добавить в друзья",
"common.cancel": "Отмена",
"comments.deleteDescription": "Этот ответ будет удалён навсегда.",
"comments.empty": "Ответов пока нет. Пролей чай первым ☕",
"comments.delete": "Удалить ответ",
"common.sending": "Отправка...",
"common.done": "Готово",
    "composer.sentToModeration": "Ваш пост отправлен на модерацию",
    "composer.moderationDesc": "Он появится в ленте после того, как команда одобрит его!",
  },
  KK: {
    "nav.feed": "Таспа",
    "nav.events": "Ивенттер",
    "nav.myCampus": "Жеке кампусым",
    "nav.groups": "Топтар",
    "nav.messages": "Хабарламалар",
    "nav.notifications": "Хабарландырулар",
    "nav.friends": "Достар",
    "nav.settings": "Баптаулар",
    "auth.login": "Кіру",
    "auth.signup": "Тіркелу",
    "auth.logout": "Шығу",
    "settings.back": "← Баптауларға қайту",
    "settings.language.title": "Тіл",
    "settings.language.subtitle": "KIMEPish интерфейсінің тілін таңдаңыз.",
    "settings.language.active": "актив",
    "settings.language.tip": "Керемет таңдау",
    "common.save": "Сақтау",
    "common.loading": "Жүктелуде…",
    "composer.spill": "Жариялау",
    "composer.posting": "Жариялануда...",
    "composer.placeholder": "Бүгін кимэпімізде қандай жаңалық? ☕",
    "composer.open": "Пост жазу",
    "composer.removeImage": "Суретті өшіру",
    "composer.photoNonAnonOnly": "Сурет тек анон емес посттарда қолжетімді",
    "composer.anonOn": "Анон ✅",
    "composer.anonOff": "Анон ❌",
    "composer.left": "қалды",
    "composer.photoOnlyNonAnon": "Сурет тек аноним емес посттарда қолжетімді",
    "common.close": "Жабу",
    "common.clear": "Тазалау",
    "cat.gossips": "Өсектер",
    "cat.uni": "Ғылым, білім",
    "cat.confessions": "Танылу",
    "cat.market": "Базар",
    "cat.other": "Басқа",
    "feed.sort": "Сұрыптау",
    "feed.sortedByLikes": "Лайк бойынша сұрыптау",
    "feed.category": "Бөлім",
    "feed.visibility": "Көрінуі",
    "feed.latest": "Жаңалары",
"feed.topTea": "Кереметтері ☕",
"feed.all": "Барлығы",
"feed.anon": "Анон",
"feed.nonAnon": "Анон емес",
"feed.caughtUp": "Бәрін қарап шықтыңыз.",
"feed.noPosts": "Әзірге пост жоқ.",
"events.title": "Ивенттер",
"events.create": "Ивент құру",
"events.request": "Іс-шара сұрау",
"events.sort.soon": "Ең жақын",
"events.sort.going": "Көбі барады",
"events.sort.new": "Жаңа",
"events.none": "Әзірге іс-шара жоқ.",
"events.end": "Соңына жеттіңіз.",
"events.going": "Барамын",
"events.goingCount": "барады",
"events.viewAttendees": "Қатысушыларды көру",
"events.noOneYet": "Әлі ешкім жоқ.",
"events.imageAlt": "Іс-шара",
"common.avatarAlt": "аватар",
"events.request.title": "Іс-шара сұрау",
"events.request.subtitle": "Тек ресми / топ аккаунттары іс-шара жариялай алады. Сіздің сұранысыңыз қаралады.",
"events.form.title": "Атауы",
"events.form.description": "Сипаттама",
"events.form.locationOptional": "Орны (міндетті емес)",
"events.request.sending": "Жіберілуде…",
"events.request.send": "Сұранысты жіберу",
"events.new.title": "Іс-шара құру",
"events.new.imageOptional": "Іс-шара суреті (міндетті емес)",
"events.new.removeImage": "Суретті өшіру",
"events.new.changeImage": "Өзгерту",
"events.new.uploading": "Жүктелуде…",
"events.new.uploadImage": "Сурет жүктеу",
"events.new.imageHint": "Бір сурет, 4MB дейін. (Міндетті емес)",
"events.new.saving": "Сақталуда…",
"events.new.publish": "Жариялау",
"messages.title": "Хабарламалар",
"messages.newDm": "Жаңа DM",
"messages.newGroup": "Жаңа топ",
"messages.administration": "Әкімшілік",
"messages.group": "Топ",
"messages.chat": "Чат",
"messages.noMessages": "Әзірге хабарлама жоқ",
"messages.you": "Сіз",
"messages.unknown": "белгісіз",
"messages.placeholder": "Хабарлама…",
"messages.send": "Жіберу",
"messages.members": "қатысушылар",
"messages.supportHint": "Шағымдар, ұсыныстар және өтініштер үшін KIMEPish әкімшілігіне жазыңыз.",
"messages.supportEmpty": "Мәселеңізді немесе ұсынысыңызды жазыңыз — жақында жауап береміз.",
"messages.emptyThread": "Әзірге хабарлама жоқ. Сәлем айтыңыз 👋",
"messages.suggested": "Ұсынылғандар",
"messages.friends": "Достар",
"messages.openError": "Чатты ашу мүмкін болмады. Қайта көріңіз.",
"messages.searchUser": "Аты немесе username бойынша іздеу",
"messages.opening": "Ашылуда…",
"messages.openChat": "Чатты ашу",
"messages.userNotFound": "Пайдаланушы табылмады.",
"messages.cannotDmSelf": "Өзіңізге жаза алмайсыз.",
"messages.signInAgain": "Қайта кіріңіз.",
"messages.noResults": "Нәтиже жоқ.",
"messages.friend": "Дос",
"messages.groupName": "Топ атауы",
"messages.remove": "Өшіру",
"messages.addPeople": "Адамдарды қосу (аты немесе username бойынша іздеу)",
"messages.creating": "Құрылуда…",
"messages.createGroup": "Топ құру",
"notifications.title": "Хабарландырулар",
"notifications.subtitle": "Достар, посттар, іс-шаралар және аккаунтыңыз туралы жаңартулар.",
"notifications.unread": "оқылмаған",
"notifications.allCaughtUp": "Барлығы қаралды",
"notifications.marking": "Белгіленуде...",
"notifications.markAllRead": "Барлығын оқылған деп белгілеу",
"notifications.none": "Әзірге хабарландыру жоқ.",
"notifications.unreadDot": "Оқылмаған",
"notifications.end": "Хабарландырулар соңы.",
"settings.title": "Баптаулар",
"settings.subtitle": "Құпиялылық, қауіпсіздік, тіл, тақырып және қолдау — бәрі бір жерде.",
"settings.controlCenter": "Сіздің басқару орталығыңыз",
"settings.controlCenterDesc": "Жақында керемет заттар қосылады. Бізбен бірге шай ішуді жалғастырыңыз!",

"settings.profile.title": "Бейне",
"settings.profile.desc": "Бейнені, кампус баптауларын және жеке ақпаратты өңдеңіз.",

"settings.privacy.title": "Құпиялылық (Аккаунт)",
"settings.privacy.desc": "Достар тізімін, топтарды кім көретінін және кім сізге жаза алатынын басқарыңыз.",

"settings.groups.title": "Топ құпиялылығы",
"settings.groups.desc": "Өзіңіз иелік ететін топтар үшін қатысушылар тізімінің көрінуін басқарыңыз.",
"settings.groups.badge": "Иелер/Админдер",
"settings.groups.pageDesc": "Топ мемберлер тізімін кім көре алатынын басқарыңыз (әр топ бойынша).",
"settings.groups.noneTitle": "Басқаратын топтар жоқ",
"settings.groups.noneDesc": "Егер сіз Президент немесе Админ болсаңыз, топтар осында көрінеді.",
"settings.groups.rolePresident": "Президент",
"settings.groups.roleAdmin": "Админ",
"settings.groups.everyone": "Барлығы қатысушыларды көре алады",
"settings.groups.membersOnly": "Тек қатысушылар",
"settings.groups.tip.before": "Кеңес: егер",
"settings.groups.tip.bold": "Тек қатысушылар",
"settings.groups.tip.after": " таңдасаңыз, мүше емес адамдар жеке хабар көреді.",

"settings.security.title": "Қауіпсіздік",
"settings.security.desc": "Құпиясөзді өзгертіп, аккаунтыңызды қауіпсіз ұстаңыз.",

"settings.language.titleShort": "Тіл",
"settings.language.desc": "Қолданба тілін таңдаңыз (English, Русский, Қазақша).",
"settings.language.option.en": "Ағылшын",
"settings.language.option.ru": "Орыс",
"settings.language.option.kk": "Қазақ",

"settings.theme.titleShort": "Интерфейс түстері",
"settings.theme.desc": "Жарық және қараңғы режим арасында ауысыңыз.",

"settings.support.title": "Қолдау",
"settings.support.desc": "Шағымдар, ұсыныстар және өтініштер үшін KIMEPish билігімен қолдау чатын ашыңыз.",
"settings.theme.title": "Тақырып",
"settings.theme.pageDesc": "KIMEPish көрінісін баптаңыз.",
"settings.theme.appearance": "Көрініс",
"settings.theme.light": "Жарық",
"settings.theme.lightDesc": "Таза әрі жарық көрініс",
"settings.theme.dark": "Қараңғы",
"settings.theme.darkDesc": "Түнде көзге жайлы",
"settings.theme.system": "Жүйелік",
"settings.theme.systemDesc": "Құрылғы баптауына сай",
"settings.theme.tip": "Кеңес: Арғын болсаңыз, қараңғы режимді таңдаңыз.",

"settings.support.pageDesc.before": "Қателер туралы хабарлаңыз, ұсыныс жіберіңіз. Сізде KIMEPish әкімшілігімен",
"settings.support.pageDesc.bold": "бір",
"settings.support.pageDesc.after": "тұрақты чат болады.",

"settings.privacy.pageDesc": "Адамдар не көре алатынын және кім сізбен байланыса алатынын басқарыңыз.",
"settings.privacy.friendsList.title": "Менің достар тізімімді кім көре алады",
"settings.privacy.friendsList.desc": "Достар тізімін бәрі немесе тек достар ғана көретінін таңдаңыз.",
"settings.privacy.groups.title": "Менің топтарымды кім көре алады",
"settings.privacy.groups.desc": "Профильдегі топтардың көрінуін басқарыңыз.",
"settings.privacy.dm.title": "Маған кім жаза алады",
"settings.privacy.dm.desc": "Жеке хабарламаларды барлығынан немесе тек достардан қабылдаңыз.",
"settings.privacy.save": "Құпиялылық баптауларын сақтау",

"settings.option.onlyMe": "Тек мен",
"settings.option.friends": "Достар",
"settings.option.everyone": "Барлығы",
"settings.option.friendsOnly": "Тек достар",

"settings.profile.editTitle": "Бейнені өңдеу",
"settings.profile.editDesc": "Фото тек сақтау батырмасын басқаннан кейін профильде өзгертіледі.",
"settings.profile.previewAlt": "Профиль алдын ала көрінісі",
"settings.profile.campusTitle": "Кампус стат баптаулары",
"settings.profile.campusDesc": "Олар кампус күйін қосқанда қолданылады.",
"settings.profile.visibleTo": "Кімге көрінеді:",
"settings.profile.expiresIn": "Аяқталу уақыты:",
"settings.profile.duration2h": "2 сағат",
"settings.profile.duration4h": "4 сағат",
"settings.profile.durationEod": "Күн соңына дейін",
"settings.profile.statusPlaceholder": "Статустау (макс. 80 таңба)",
"settings.profile.majorPlaceholder": "Мамандықтау",
"settings.profile.yearPlaceholder": "Оқу жылы (1–4)",
"settings.profile.emojiPlaceholder": "Эмодзи",
"settings.profile.saveChanges": "Өзгерістерді сақтау",
"settings.profile.saving": "Сақталуда…",
"settings.profile.college.bcb": "Bang College of Business",
"settings.profile.college.css": "College of Social Sciences",
"settings.profile.college.law": "School of Law",
"settings.profile.college.he": "School of Humanities and Education",
"settings.profile.college.mcs": "School of Mathematics and Computer Science",
"settings.profile.college.other": "Басқа (Гарвард типа)",
"friends.title": "Достар",
"friends.requests": "Сұраныстар",
"friends.noRequests": "Сұраныс жоқ",
"friends.accept": "Қабылдау",
"friends.decline": "Бас тарту",
"friends.myFriends": "Менің достарым",
"friends.noFriendsYet": "Әзірге дос жоқ(",
"friends.findPeople": "Адам табу",
"friends.searchUsersPlaceholder": "Username бойынша іздеу… (мысалы, batman немесе @batman)",
"friends.friends": "Достар",
"friends.requested": "Сұраныс жіберілді",
"friends.requestedYou": "Сізге сұраныс жіберді",
"friends.add": "Қосу",
"friends.noUsersFound": "Пайдаланушылар табылмады.",
"friends.searchFriendsPlaceholder": "Достарды іздеу… (мысалы, @dais)",
"friends.all": "Барлығы",
"friends.onCampus": "Кампуста",
"friends.offCampus": "Кампуста емес",
"friends.shown": "көрсетілді",
"friends.noMatches": "Сәйкестік жоқ",
"friends.remove": "Өшіру",
"friends.requestSent": "Сұраныс жіберілді",
"friends.cancel": "Болдырмау",
"friends.you": "Сіз",
"groups.title": "Топтар",
"groups.subtitle": "Қазір тек ресми KIMEP ұйымдары көрсетіледі.",
"groups.requestOfficial": "Ресми топ сұрау",
"groups.noneApproved": "Әзірге мақұлданған топ жоқ.",
"groups.members": "мүше",
"groups.followers": "жазылушы",

"groups.requestSent": "Сұраныс жіберілді",
"groups.requestPending.before": "Топқа сұранысыңыз қазір",
"groups.requestPending.bold": "мақұлдауды күтуде",
"groups.requestPending.after": "Біз оны қарап, мақұлданғаннан кейін топты жариялаймыз.",

"groups.requestTitle": "Топ сұрау",
"groups.requestDesc": "Кез келген адам сұраныс жібере алады. Содан кейін топ ресми болып іс-шара жариялай алады.",
"groups.form.name": "Топ атауы (мысалы, Алаш)",
"groups.form.slug": "Slug (мысалы, alashorda)",
"groups.form.description": "Қысқаша сипаттама (міндетті емес)",
"groups.form.image": "Логотип URL-ы (міндетті емес)",
"groups.tip.before": "Кеңес: slug тек кіші әріппен, бос орынсыз болсын. Мысал:",
"groups.tip.example": "kimepmun",
"groups.sending": "Жіберілуде…",
"groups.sendRequest": "Сұраныс жіберу",

"groups.createTitle": "Топ құру",
"groups.create.name": "Топ атауы",
"groups.create.description": "Сипаттама (міндетті емес)",
"groups.create.public": "Ашық (кез келген адам қосыла алады)",
"groups.create.private": "Жабық (сұраныстарды кейін қосамыз)",
"groups.creating": "Құрылуда…",
"groups.create": "Құру",
"group.president": "Президент",
"group.tab.about": "Топ туралы",
"group.tab.events": "Іс-шаралар",
"group.tab.members": "Қатысушылар",
"group.aboutTitle": "Топ туралы",
"group.aboutDesc": "Бұл ресми топ парақшасы. Барлығына көп рақмет.",
"group.eventCreated": "Іс-шара құрылды.",
"group.eventsTitle": "Іс-шаралар",
"group.eventsDesc": "Бұл жерде топтың ресми іс-шаралары көрсетіледі.",
"group.membersPrivate": "Қатысушылар тізімі жабық. Оны тек мемберлер көре алады.",
"group.signInToJoin": "Қосылу сұранысын жіберу үшін кіріңіз.",
"group.requestToSeeMembers": "Қатысушыларды көру үшін топқа қосылу сұранысын жіберіңіз.",
"group.membershipRequests": "Қосылу сұраныстары",
"group.membershipRequestsDesc": "Қосылу сұраныстарын мақұлдаңыз немесе қабылдамаңыз.",
"group.visibleToMembers": "Қатысушыларға көрінеді",
"group.noMembersYet": "Әзірге қатысушы жоқ.",
"common.edit": "Өңдеу",
"group.editTitle": "Топты өңдеу",
"group.back": "Артқа",
"group.avatar": "Топ аватары",
"group.avatarAlt": "Топ аватары",
"group.noPhoto": "Фото жоқ",
"group.avatarTip": "Кеңес: жақсы көріну үшін төртбұрышты сурет қолданыңыз.",
"group.form.nameLabel": "Топ атауы",
"group.form.namePlaceholder": "Топ атауы",
"group.form.descLabel": "Қысқаша сипаттама (міндетті емес)",
"group.form.descPlaceholder": "Бұл топ не туралы?",
"profile.alt": "Профиль",
"profile.student": "Студент",
"profile.undeclared": "Көрсетілмеген",
"profile.year": "Курс",
"profile.editProfile": "Профильді өңдеу",
"profile.posts": "Посттар",
"profile.friendsPrivate": "Достар тізімі жабық",
"profile.groupsPrivate": "Топтар тізімі жабық",
"profile.onlyFriendsCanView": "Бұл тізімді тек достар көре алады.",

"campus.justNow": "жаңа ғана",
"campus.oneMinuteAgo": "1м бұрын",
"campus.minutesAgoShort": "м бұрын",
"campus.noStatus": "Кампус статусы жоқ",
"campus.on": "Кампуста",
"campus.off": "Кампуста емес",
"profile.addFriend": "Досқа қосу",
"profile.acceptFriend": "Достықты қабылдау",
"profile.messageFriendsOnly": "Бұл пайдаланушыға тек достары жаза алады.",
"profile.messageError": "Чатты қазір ашу мүмкін болмады. Қайта көріңіз.",
"messages.message": "Хабарлама",
"comments.title": "Жауаптар",
"comments.none": "Әзірге жауап жоқ. Бірінші болып жаз ☕",
"comments.deleteTitle": "Осы жауапты өшіру керек пе?",
"comments.deleteDesc": "Бұл жауап біржола өшіріледі.",
"comments.deleteConfirm": "Иә, өшіру",
"comments.deleteOne": "Жауапты өшіру",
"comments.anonymousOn": "Анон ✅",
"comments.anonymousOff": "Анон ❌",
"comments.signInToReply": "Жауап беру үшін кіріңіз",
"comments.replyPlaceholder": "Жауап жазу…",
"comments.sending": "Жіберілуде...",
"common.anonymous": "Аноним",
"common.you": "Сіз",
"common.send": "Жіберу",
"common.no": "Жоқ",
"post.title": "Пост",
"post.openedFromNotification": "Хабарламадан ашылды",
"comments.sectionTitle": "Пікірлер",
"groups.follow": "Жазылу",
"groups.following": "Жазылдыңыз",
"groups.requestToJoin": "Қосылуға сұраныс жіберу",
"groups.youAreMember": "Сіз мемберсіз",
"composer.removePhoto": "Суретті өшіру",
"composer.anonymousOn": "Анон ✅",
"composer.anonymousOff": "Анон емес ❌",
"messages.inputPlaceholder": "Хабарлама…",
"messages.sending": "Жіберілуде...",
"messages.unread": "Оқылмаған",
"messages.friendsOnly": "Бұл пайдаланушы тек достардан хабарлама қабылдайды.",
"messages.tryAgain": "Хабарлама жіберілмеді. Қайта көріңіз.",
"messages.noMessagesYet": "Әзірге хабарлама жоқ.",
"messages.groupMembersLimit": "Қатысушылар шегі:",
"common.remove": "Өшіру",
"common.noResults": "Нәтиже жоқ.",
"friends.friend": "Дос",
"friends.addFriend": "Досқа қосу",
"common.cancel": "Болдырмау",
"comments.deleteDescription": "Бұл жауап біржола өшіріледі.",
"comments.empty": "Әзірге жауаптар жоқ. Бірінші болып шай ☕",
"comments.delete": "Жауапты өшіру",
"common.sending": "Жіберілуде...",
"common.done": "Дайын",
    "composer.sentToModeration": "Сіздің жазбаңыз модерацияға жіберілді",
    "composer.moderationDesc": "Ол команда мақұлдағаннан кейін лентада пайда болады!",
  },
};

export function getDict(lang: Lang) {
  return DICTS[lang] ?? DICTS.EN;
}
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

function _classPrivateFieldLooseBase(receiver, privateKey) { if (!Object.prototype.hasOwnProperty.call(receiver, privateKey)) { throw new TypeError("attempted to use private field on non-instance"); } return receiver; }

var id = 0;

function _classPrivateFieldLooseKey(name) { return "__private_" + id++ + "_" + name; }

class ContactSegments {
  constructor(options) {
    Object.defineProperty(this, _parent, {
      writable: true,
      value: void 0
    });
    _classPrivateFieldLooseBase(this, _parent)[_parent] = options;
  }

  get(querystring, cb) {
    let qs = {};

    if (querystring) {
      qs = _classPrivateFieldLooseBase(this, _parent)[_parent]._validate(['count', 'depth', 'lastUpdatedAt', 'orderBy', 'page', 'search'], querystring);
    }

    return _classPrivateFieldLooseBase(this, _parent)[_parent]._request({
      api: 'REST',
      uri: '/assets/contact/segments',
      qs: qs
    }, cb);
  }

  getOne(id, querystring, cb) {
    let qs = {};

    if (querystring) {
      qs = _classPrivateFieldLooseBase(this, _parent)[_parent]._validate(['depth'], querystring);
    }

    return _classPrivateFieldLooseBase(this, _parent)[_parent]._request({
      api: 'REST',
      uri: `/assets/contact/segment/${id}`,
      qs: qs
    }, cb);
  }

  create(contactSegment, cb) {
    const data = _classPrivateFieldLooseBase(this, _parent)[_parent]._validate(['accessedAt', 'count', 'createdAt', 'createdBy', 'currentStatus', 'depth', 'description', 'elements', 'folderId', 'id', 'isStale', 'lastCalculatedAt', 'name', 'permissions', 'scheduledFor', 'sourceTemplateId', 'type', 'updatedAt', 'updatedBy'], contactSegment);

    return _classPrivateFieldLooseBase(this, _parent)[_parent]._request({
      api: 'REST',
      uri: '/assets/contact/segment',
      method: 'post',
      data: data
    }, cb);
  }

  update(id, contactSegment, cb) {
    const data = _classPrivateFieldLooseBase(this, _parent)[_parent]._validate(['accessedAt', 'count', 'createdAt', 'createdBy', 'currentStatus', 'depth', 'description', 'elements', 'folderId', 'id', 'isStale', 'lastCalculatedAt', 'name', 'permissions', 'scheduledFor', 'sourceTemplateId', 'type', 'updatedAt', 'updatedBy'], contactSegment);

    return _classPrivateFieldLooseBase(this, _parent)[_parent]._request({
      api: 'REST',
      uri: `/assets/contact/segment/${id}`,
      method: 'put',
      data: data
    }, cb);
  }

  delete(id, cb) {
    return _classPrivateFieldLooseBase(this, _parent)[_parent]._request({
      api: 'REST',
      uri: `/assets/contact/segment/${id}`,
      method: 'delete'
    }, cb);
  }

  queue(id, cb) {
    return _classPrivateFieldLooseBase(this, _parent)[_parent]._request({
      api: 'REST',
      uri: `/assets/contact/segment/queue/${id}`,
      method: 'post',
      data: {}
    }, cb);
  }

  recent(querystring, cb) {
    let qs = {};

    if (querystring) {
      qs = _classPrivateFieldLooseBase(this, _parent)[_parent]._validate(['count', 'depth'], querystring);
    }

    return _classPrivateFieldLooseBase(this, _parent)[_parent]._request({
      api: 'REST',
      uri: '/assets/contact/segments/recent',
      qs: qs
    }, cb);
  }

}

exports.default = ContactSegments;

var _parent = _classPrivateFieldLooseKey("parent");

module.exports = exports.default;
//# sourceMappingURL=contactSegments.js.map

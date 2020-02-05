'use strict';

const rclnodejs = require('bindings')('rclnodejs');
const Entity = require('./entity.js');
const debug = require('debug')('rclnodejs:subscription');
const GOAL_STATES = ['ACCEPTED', 'EXECUTING', 'CANCELING', 'SUCCEEDED', 'ABORTED', 'CANCELED']

/**
 * @class - Class representing a ActionClient in ROS
 * @hideconstructor
 */

class ActionClient extends Entity {
  constructor(handle, typeClass, action, options, status_callback, feedback_callback, goal_response_callback, result_response_callback) {
    super(handle, typeClass, options);
    this._action = action;
    this._status_callback = status_callback;
    this._feedback_callback = feedback_callback;
    this._goal_response_callback = goal_response_callback;
    this._result_response_callback = result_response_callback;
    this.GOAL_STATES = GOAL_STATES;
    this._sequenceNumber = 0;
    this._goal_uuid = new Array();
  }

  processStatusCallback(msg) {
    this._status_message = new this._typeClass.Status();
    this._status_message.deserialize(msg);
    debug(`Status message of action ${this._action} received.`);
    this._status_callback(this._status_message.toPlainObject(this.typedArrayEnabled));
  }

  processFeedbackCallback(msg) {
    this._feedback_message = new this._typeClass.Feedback();
    this._feedback_message.deserialize(msg);
    debug(`Feedback message of action ${this._action} received.`);
    this._feedback_callback(this._feedback_message.toPlainObject(this.typedArrayEnabled));
  }

  static createActionClient(nodeHandle, typeClass, action, options, status_callback, feedback_callback, goal_response_callback, result_response_callback) {
    let type = typeClass.type();
    let handle = rclnodejs.createActionClient(nodeHandle, action, type.pkgName, options.qos);
    return new ActionClient(handle, typeClass, action, options, status_callback, feedback_callback, goal_response_callback, result_response_callback);
  }


  /**
   * Send the request and will be notified asynchronously if receiving the repsonse.
   * @param {object} request - The request to be submitted.
   * @return {number} - Status of sending goal 
   * @see {@link ResponseCallback}
   */
  sendGoal(request) {
    this._goalToSend = new this._typeClass.Goal();
    this._goalToSend = this._typeClass.Goal.createFromRefObject(request);
    this._sequenceNumber = rclnodejs.rclSendGoalRequest(this._handle, this._goalToSend.toRawROS());
    return this._sequenceNumber;
  }

  processGoalResponse(msg) {
    this._goal_response_message = new this._typeClass.GoalRes();
    this._goal_response_message.deserialize(msg);
    debug(`Feedback message of action ${this._action} received.`);
    this._goal_response_callback(this._goal_response_message.toPlainObject(this.typedArrayEnabled));
  }


  getResult(request) {
    this._get_result_req = new this._typeClass.ResultReq();
    this._get_result_req = this._typeClass.ResultReq.createFromRefObject(request);
    this._resultSequenceNumber = rclnodejs.rclSendResultRequest(this._handle, this._get_result_req.toRawROS());
    return this._resultSequenceNumber;
  }

  processResultResponse(msg) {
    this._result_response_message = new this._typeClass.ResultRes();
    this._result_response_message.deserialize(msg);
    debug(`Feedback message of action ${this._action} received.`);
    this._result_response_callback(this._result_response_message.toPlainObject(this.typedArrayEnabled));
  }

  /**
   * @type {string}
   */
  get action() {
    return this._action;
  }
};

module.exports = ActionClient;
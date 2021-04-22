/******************************************************************************\

                  This file is part of the Buildbotics firmware.

         Copyright (c) 2015 - 2021, Buildbotics LLC, All rights reserved.

          This Source describes Open Hardware and is licensed under the
                                  CERN-OHL-S v2.

          You may redistribute and modify this Source and make products
     using it under the terms of the CERN-OHL-S v2 (https:/cern.ch/cern-ohl).
            This Source is distributed WITHOUT ANY EXPRESS OR IMPLIED
     WARRANTY, INCLUDING OF MERCHANTABILITY, SATISFACTORY QUALITY AND FITNESS
      FOR A PARTICULAR PURPOSE. Please see the CERN-OHL-S v2 for applicable
                                   conditions.

                 Source location: https://github.com/buildbotics

       As per CERN-OHL-S v2 section 4, should You produce hardware based on
     these sources, You must maintain the Source Location clearly visible on
     the external case of the CNC Controller or other product you make using
                                   this Source.

                 For more information, email info@buildbotics.com

\******************************************************************************/

'use strict'


module.exports = {
  template: "#io-indicator-template",
  props: ['name', 'state'],


  computed: {
    klass: function () {
      if (this.name == 'min-switch-0') return this.get_motor_min_class(0);
      if (this.name == 'min-switch-1') return this.get_motor_min_class(1);
      if (this.name == 'min-switch-2') return this.get_motor_min_class(2);
      if (this.name == 'min-switch-3') return this.get_motor_min_class(3);
      if (this.name == 'max-switch-0') return this.get_motor_max_class(0);
      if (this.name == 'max-switch-1') return this.get_motor_max_class(1);
      if (this.name == 'max-switch-2') return this.get_motor_max_class(2);
      if (this.name == 'max-switch-3') return this.get_motor_max_class(3);
      if (this.name == 'estop')  return this.get_input_class('ew', 'et');
      if (this.name == 'probe')  return this.get_input_class('pw', 'pt');
      if (this.name == 'load-1') return this.get_output_class('1');
      if (this.name == 'load-2') return this.get_output_class('2');
      if (this.name == 'fault')  return this.get_output_class('f');
      if (this.name == 'tool-enable-mode')    return this.get_output_class('e');
      if (this.name == 'tool-direction-mode') return this.get_output_class('d');
    },


    tooltip: function () {
      if (this.name == 'min-switch-0') return this.get_motor_min_tooltip(0);
      if (this.name == 'min-switch-1') return this.get_motor_min_tooltip(1);
      if (this.name == 'min-switch-2') return this.get_motor_min_tooltip(2);
      if (this.name == 'min-switch-3') return this.get_motor_min_tooltip(3);
      if (this.name == 'max-switch-0') return this.get_motor_max_tooltip(0);
      if (this.name == 'max-switch-1') return this.get_motor_max_tooltip(1);
      if (this.name == 'max-switch-2') return this.get_motor_max_tooltip(2);
      if (this.name == 'max-switch-3') return this.get_motor_max_tooltip(3);
      if (this.name == 'estop')  return this.get_input_tooltip('ew', 'et');
      if (this.name == 'probe')  return this.get_input_tooltip('pw', 'pt');
      if (this.name == 'load-1') return this.get_output_tooltip('1');
      if (this.name == 'load-2') return this.get_output_tooltip('2');
      if (this.name == 'fault')  return this.get_output_tooltip('f');
      if (this.name == 'tool-direction-mode')
        return this.get_output_tooltip('d');
      if (this.name == 'tool-enable-mode')
        return this.get_output_tooltip('e');
    }
  },


  methods: {
    get_io_state_class: function (active, state) {
      if (typeof active == 'undefined' || typeof state == 'undefined')
        return 'fa-exclamation-triangle warn';

      if (state == 2) return 'fa-circle-o';

      return (state ? 'fa-plus-circle' : 'fa-minus-circle') + ' ' +
        (active ? 'active' : 'inactive');
    },


    get_input_active: function (stateCode, typeCode) {
      var type = this.state[typeCode];
      var state = this.state[stateCode];

      if (type == 1) return !state;     // Normally open
      else if (type == 2) return state; // Normally closed

      return false
    },


    get_input_class: function (stateCode, typeCode) {
      return this.get_io_state_class(this.get_input_active(stateCode, typeCode),
                                     this.state[stateCode]);
    },


    get_output_class: function (output) {
      return this.get_io_state_class(this.state[output + 'oa'],
                                     this.state[output + 'os']);
    },


    get_motor_min_class: function (motor) {
      return this.get_input_class(motor + 'lw', motor + 'ls');
    },


    get_motor_max_class: function (motor) {
      return this.get_input_class(motor + 'xw', motor + 'xs');
    },


    get_tooltip: function (mode, active, state) {
      if (typeof mode == 'undefined' || typeof active == 'undefined' ||
          typeof state == 'undefined') return 'Invalid';

      if (state == 0) state = 'Lo/Gnd';
      else if (state == 1) state = 'Hi/+3.3v';
      else if (state == 2) state = 'Tristated';
      else return 'Invalid';

      return 'Mode: ' + mode + '\nActive: ' + (active ? 'True' : 'False') +
        '\nLevel: ' + state;
    },


    get_input_tooltip: function (stateCode, typeCode) {
      var type = this.state[typeCode];
      if (type == 0) return 'Disabled';
      else if (type == 1) type = 'Normally open';
      else if (type == 2) type = 'Normally closed';

      var active = this.get_input_active(stateCode, typeCode);
      var state = this.state[stateCode];

      return this.get_tooltip(type, active, state);
    },


    get_output_tooltip: function (output) {
      var mode = this.state[output + 'om'];
      if (mode == 0) return 'Disabled';
      else if (mode == 1) mode = 'Lo/Hi';
      else if (mode == 2) mode = 'Hi/Lo';
      else if (mode == 3) mode = 'Tri/Lo';
      else if (mode == 4) mode = 'Tri/Hi';
      else if (mode == 5) mode = 'Lo/Tri';
      else if (mode == 6) mode = 'Hi/Tri';
      else mode = undefined;

      var active = this.state[output + 'oa'];
      var state = this.state[output + 'os'];

      return this.get_tooltip(mode, active, state);
    },


    get_motor_min_tooltip: function (motor) {
      return this.get_input_tooltip(motor + 'lw', motor + 'ls');
    },


    get_motor_max_tooltip: function (motor) {
      return this.get_input_tooltip(motor + 'xw', motor + 'xs');
    }
  }
}

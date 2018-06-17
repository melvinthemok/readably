var Tutor = require('../models/tutor')
var PreSchool = require('../models/preSchool')
var Fitzroy = require('../models/fitzroy')
var PostFitzroy = require('../models/postFitzroy')
var Saturdate = require('../models/saturdate')

var formatDateShort = require('../helpers/formatDateShort')
var formatDateLong = require('../helpers/formatDateLong')
var sortByProperty = require('../helpers/sortByProperty')
var studentsOfTutor = require('../helpers/studentsOfTutor')
var studentsPreferringTutor = require('../helpers/studentsPreferringTutor')
var fitzroyBookLevelPlusX = require('../helpers/fitzroyBookLevelPlusX')

var tutorController = {
  index: function (req, res) {
    Tutor.find({}, function (err, allTutors) {
      if (err) {
        req.flash('error', err.toString())
        res.redirect('/index')
      } else {
        Fitzroy.distinct('attendance.tutor', function (err, fitzroyTutors) {
          if (err) {
            req.flash('error', err.toString())
            res.redirect('/index')
          } else {
            PreSchool.distinct('attendance.tutor', function (err, preSchoolTutors) {
              if (err) {
                req.flash('error', err.toString())
                res.redirect('/index')
              } else {
                PostFitzroy.distinct('attendance.tutor', function (err, postFitzroyTutors) {
                  if (err) {
                    req.flash('error', err.toString())
                    res.redirect('/index')
                  } else {
                    res.render('tutors/index', {
                      fitzroyTutors: fitzroyTutors,
                      preSchoolTutors: preSchoolTutors,
                      postFitzroyTutors: postFitzroyTutors,
                      allTutors: sortByProperty(allTutors, 'name')
                    })
                  }
                })
              }
            })
          }
        })
      }
    })
  },

  show: function (req, res) {
    Tutor.findById(req.params.id, function (err, chosenTutor) {
      if (err) {
        req.flash('error', err.toString())
        res.redirect('/tutors')
      } else {
        PreSchool.find({})
        .populate('preferredTutors')
        .populate({
          path: 'attendance.date',
          model: 'Saturdate'
        })
        .populate({
          path: 'attendance.tutor',
          model: 'Tutor'
        })
        .exec(function (err, allPreSchools) {
          if (err) {
            req.flash('error', err.toString())
            res.redirect('/tutors')
          } else {
            Fitzroy.find({})
              .populate('preferredTutors')
              .populate({
                path: 'attendance.date',
                model: 'Saturdate'
              })
              .populate({
                path: 'attendance.tutor',
                model: 'Tutor'
              })
              .exec(function (err, allFitzroys) {
                if (err) {
                  req.flash('error', err.toString())
                  res.redirect('/tutors')
                } else {
                  PostFitzroy.find({})
                    .populate('preferredTutors')
                    .populate({
                      path: 'attendance.date',
                      model: 'Saturdate'
                    })
                    .populate({
                      path: 'attendance.tutor',
                      model: 'Tutor'
                    })
                    .exec(function (err, allPostFitzroys) {
                      if (err) {
                        req.flash('error', err.toString())
                        res.redirect('/tutors')
                      } else {
                        res.render('tutors/show', {
                          chosenTutor: chosenTutor,
                          allPreferringPreSchools: studentsPreferringTutor(allPreSchools, chosenTutor),
                          allTutoredPreSchools: studentsOfTutor(allPreSchools, chosenTutor),
                          allPreferringFitzroys: studentsPreferringTutor(allFitzroys, chosenTutor),
                          allTutoredFitzroys: studentsOfTutor(allFitzroys, chosenTutor),
                          allPreferringPostFitzroys: studentsPreferringTutor(allPostFitzroys, chosenTutor),
                          allTutoredPostFitzroys: studentsOfTutor(allPostFitzroys, chosenTutor),
                          formatDateShort: formatDateShort,
                          fitzroyBookLevelPlusX: fitzroyBookLevelPlusX
                        })
                      }
                    })
                }
              })
          }
        })
      }
    })
  },

  delete: function (req, res) {
    Tutor.findByIdAndRemove(req.params.id, function (err, chosenTutor) {
      if (err) {
        req.flash('error', err.toString())
        res.redirect('/tutors')
      } else {
        req.flash('success', chosenTutor.name + ' successfully deleted!')
        res.redirect('/tutors')
      }
    })
  },

  attendance: {
    index: function (req, res) {
      Tutor.find({})
        .populate({
          path: 'attendance.date',
          model: 'Saturdate'
        }).exec(function (err, allTutors) {
        if (err) {
          req.flash('error', err.toString())
          res.redirect('/tutors')
        } else {
          res.render('tutors/attendance/index', {
            allTutors: sortByProperty(allTutors, 'name'),
            formatDateShort: formatDateShort
          })
        }
      })
    },

    edit: function (req, res) {
      Tutor.findById(req.params.id)
        .populate({
          path: 'attendance.date',
          model: 'Saturdate'
        }).exec(function (err, chosenTutor) {
          if (err) {
            req.flash('error', err.toString())
            res.redirect('/tutors')
          } else {
            Saturdate.find({}, function (err, allSaturdates) {
              if (err) {
                req.flash('error', err.toString())
                res.redirect('/tutors')
              } else {
                var sortedAllSaturdates = sortByProperty(allSaturdates, 'date')
                var nextSaturdateIndex = sortedAllSaturdates.findIndex(function (saturdate) {
                  return saturdate.date > Date.now() - 64 * 60 * 60 * 1000
                })
                res.render('tutors/attendance/show', {
                  chosenTutor: chosenTutor,
                  isCurrentUser: req.user.id === req.params.id,
                  latestSaturdates: sortedAllSaturdates.slice(nextSaturdateIndex,  nextSaturdateIndex + 4),
                  formatDateLong: formatDateLong
                })
              }
            })
          }
        })
    },

    update: function (req, res) {
      var attendance = []
      for (var key in req.body) {
        attendance.push({
          'date': key,
          'attending': req.body[key]
        })
      }
      Tutor.update({
        _id: req.params.id
      }, {
        attendance: []
      }, function (err, clearedTutor) {
        if (err) {
          req.flash('error', err.toString())
          res.redirect('/tutors/attendance/' + req.params.id)
        } else {
          Tutor.update({
            _id: req.params.id
          }, {
            attendance: attendance
          }, function (err, updatedTutor) {
            if (err) {
              req.flash('error', err.toString())
              res.redirect('/tutors/attendance/' + req.params.id)
            } else {
              req.flash('success', 'Your attendance successfully updated!')
              res.redirect('/tutors/attendance/' + req.params.id)
            }
          })
        }
      })
    }
  }
}

module.exports = tutorController

import React from 'react';
import firebase from 'firebase';
import moment from 'moment';
import DayPickerInput from 'react-day-picker/DayPickerInput';
import 'react-day-picker/lib/style.css';
import QuizComponent from './QuizComponent';
// import { connect } from 'react-redux';
// import { Link } from 'react-router';

class CreateTest extends React.Component {
  state = {
    title: '',
    time: '',
    comment: '',
    error: '',
    successMessage: '',
    selectedTest: '',
    selectedCategory: '',
    allQuestions: {},
    videos: {
      'L TEST': '//www.youtube.com/embed/gixqOS8qBNA?rel=0',
      'TUG TEST': '//www.youtube.com/embed/VljdYRXMIE8?rel=0',
      'PEQ TEST': '/images/sliderEx.gif'
    },
    text: {
      'L TEST': 'When you say "Go", begin timing using a stopwatch and instruct the patient to:\n'+
        '\t(1) Stand up from the chair.\n'+
        '\t(2) Walk 3 meters to the marker on the floor at your normal pace.\n'+
        '\t(3) Turn 90 degrees.\n'+
        '\t(4) Continue walking 7 meters.\n'+
        '\t(5) Turn 180 degrees.\n'+
        '\t(6) Return to the marker.\n'+
        '\t(7) Turn 90 degrees.\n'+
        '\t(8) Walk back to the chair at your normal pace.\n'+
        '\t(9) Sit down again.\n'+
        'Stop timing once the patient has sat down and then record the time.',

      'TUG TEST': 'When you say "Go", begin timing using a stopwatch and instruct the patient to:\n'+
        '\t(1) Stand up from the chair.\n'+
        '\t(2) Walk along the line on the floor at your normal pace.\n'+
        '\t(3) Turn 180 degrees.\n'+
        '\t(4) Walk back to the chair at your normal pace.\n'+
        '\t(5) Sit down again.\n'+
        'Stop timing once the patient has sat down and then record the time.',
      'PEQ TEST': 'This is an analog sliding scale.'
    }
  }
  styles = {
		row: {
			'padding': 25
    },
    metric: {
      maxHeight: 500,
      'overflow': 'scroll',
      padding: 25
    }
  };

  componentWillReceiveProps (nextProps) {
    let tests;
    if (nextProps.selectedCategory && nextProps.tests) {
      if(nextProps.tests.hasOwnProperty(nextProps.selectedCategory)) {
        tests = nextProps.tests[nextProps.selectedCategory];
      }
    }
    if(tests) {
      const testData = tests[nextProps.selectedTest];
      
      if (testData) {
        this.setState({
          title: testData.title,
          time: testData.time,
          comment: testData.comment,
          selectedCategory: testData.category,
          date: moment(testData.date, 'YYYY-M-D').format('YYYY-M-D'),
          successMessage: '',
          selectedTest: nextProps.selectedTest,
          allQuestions: testData.questions
        })
      } else {
        if (nextProps.selectedCategory) {
          this.setState({
            title: '',
            time: '',
            comment: '',
            date: moment().format('YYYY-M-D'),
            selectedCategory: nextProps.selectedCategory,
            successMessage: '',
            selectedTest: nextProps.selectedTest,
            allQuestions: Object.assign({}, nextProps.questions)
          });
        }
      }
    } else {
      console.log(nextProps, 'nextProps');
      this.setState({
        title: '',
        time: '',
        date: moment().format('YYYY-M-D'),
        comment: '',
        successMessage: '',
        selectedCategory: nextProps.selectedCategory,
        selectedTest: nextProps.selectedTest,
        allQuestions: Object.assign({}, nextProps.questions)
      });
    }
  }

  saveMetric (event) {
    event.preventDefault();
    this.setState({
      error: ''
    })
    const {
      selectedTest,
      selectedCategory,
      time,
      comment,
      title,
      date,
      allQuestions
    } = this.state;

    const {
      valid,
      error
    } = this.isValid();

    if(valid) {
      const userId = firebase.auth().currentUser.uid;
      let updates = {};
      const testkey = selectedTest || firebase.database().ref()
        .child(`forms/${userId}/${this.props.formId}/tests`).push().key
      const postData = selectedCategory !== 'PEQ TEST' ? {
        id: testkey,
        formId: this.props.formId,
        category: selectedCategory,
        time,
        comment,
        title,
        date
      } : {
        id: testkey,
        formId: this.props.formId,
        category: selectedCategory,
        questions: allQuestions,
        comment,
        title,
        date
      }
      const childNode = `${selectedCategory}/${testkey}`;
      const node = `/forms/${userId}/${this.props.formId}/tests/${childNode}`;
      updates[node] = postData;
      firebase.database().ref().update(updates)
      .then(() => {
        this.props.resetValue(testkey, this.state.selectedCategory);
        this.setState({
          successMessage: 'Test was saved sucessfully'
        }, () => setTimeout(() => {
          this.setState({
            successMessage: ''
          })
        }, 2000))
      })
      .catch((error) => {
        this.setState({ error: error.message });
      });
    } else {
      this.setState({
        error
      })
    }
  }

  isValid () {
    let valid = true;
    let error = '';
    if(!this.state.title) {
      valid = false;
      error = 'Title is required to save form'
      return {
        valid,
        error
      }
    }
    const {
      allQuestions
    } = this.state;
    if(this.state.selectedCategory === 'PEQ TEST') {
      Object.keys(allQuestions).forEach((category) => {
        const halfLength = Math.ceil(allQuestions[category].length / 2)
        const filteredQuestions =  allQuestions[category]
          .filter(question => question.value || question.value === 0)
          console.log('filterQuestions.length', filteredQuestions.length, halfLength);
            valid = filteredQuestions.length >= halfLength ? true : false;
            error = 'You must answer at least 50% of all question from each section'
            return;
          })
       return {
        valid,
        error
      }
    } else {
      if(!this.state.time) {
        valid = false;
        error = 'Time value is required to save test data'
        return {
          valid,
          error
        }
      }
    }
    return {
      valid,
      error
    }
  }

  onInputChange(name, event) {
		var change = {};
		change[name] = event.target.value;
		this.setState(change);
  }

  handleChange (index, category, answer) {
    const {
      allQuestions
    } = this.state;
    allQuestions[category][index]['value'] = answer
    this.setState({
      allQuestions
    })
  }

  onDayChange = (day) => {
    console.log('day', moment(new Date('2018-2-1')).format('YYYY-M-D'));
    var change = {};
		change['date'] = moment(day).format('YYYY-M-D');
		this.setState(change);
  }

	render() {
    var errors = this.state.error ? <p> {this.state.error} </p> : '';
		return (
      <div className="modal fade" id="videoModal" tabIndex="-1"
        role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">
      <div className="modal-dialog">
      <div className="modal-content">
        <div className="modal-body">
        <button type="button" className="close btn btn-danger"
          data-dismiss="modal" aria-label="Close">
            <span aria-hidden="true">&times;</span></button>
        <div className="row">
          <div className="col-md-10 col-sm-offset-1 card card-user">
          <div className="header">
              <h4 className="title text-center">{this.state.title}</h4>
          </div>
          <div className="content">
              <div className="form-group">
                {errors && <div className="alert alert-danger">{errors}</div>}
                {this.state.successMessage &&
                <div className="alert alert-success">
                  {this.state.successMessage}
                </div>}
                <label htmlFor="exampleInputEmail1">Title</label>
                <input
                  id="exampleInputtitle1"
                  name="title"
                  type="text"
                  placeholder='Enter Title'
                  className="form-control input-md"
                  value={this.state.title}
                  onChange={this.onInputChange.bind(this, 'title')}
                />
              </div>
              <div className="form-group">
                <label htmlFor="category">Category:</label>
                <span>   {this.state.selectedCategory}</span>
              </div>
              <div className="form-group">
                <label htmlFor="date">Select date:</label>
                <DayPickerInput
                  value={this.state.date}
                  todayButton="Select Today's Date"
                  onDayChange={this.onDayChange} />
              </div>
              {this.state.selectedCategory === 'PEQ TEST' &&
                <QuizComponent allQuestions={this.state.allQuestions} handleChange={this.handleChange.bind(this)} />}
              {this.state.selectedCategory !== 'PEQ TEST' &&
                <table className="table table-bordered table-hover">
                <thead>
                  <tr>
                    <th>Scale Name</th>
                    <th>Value </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Time </td>
                    <td>
                      <input
                        id="textinput"
                        name="textinput"
                        type="text"
                        placeholder='Time in Seconds'
                        className="form-control input-md"
                        value={this.state.time}
                        onChange={this.onInputChange.bind(this, 'time')}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>}
              <form style={ this.styles.metric } className="form-horizontal"
                onSubmit={this.saveMetric.bind(this)}>

                <div className="form-group">
                  <textarea
                    rows={5}
                    id="formControlsTextarea"
                    className="form-control"
                    style={{zIndex: 'auto', position: 'relative', fontSize: 14, transition: 'none', background: 'transparent !important'}}
                    placeholder="Write a Comment"
                    onChange={this.onInputChange.bind(this, 'comment')}
                    name="comment"
                    value={this.state.comment}
                  />
                </div>
                <div className="col-xs-3 col-xs-offset-1 form-group">
                    <button type="submit" id="singlebutton"
                      name="singlebutton"
                      className="btn btn-fill btn-info col-xs-12">Save</button>
                </div>
              </form>
             {this.state.selectedCategory !== 'PEQ TEST' && <div className="panel-group" id="accordion">
                <div className="panel panel-default">
                <a data-toggle="collapse" data-parent="#accordion"
                        href="#collapse1">
                    <div className="footer stats">
                      <i className="glyphicon btn-glyphicon glyphicon-chevron-down img-circle text-info" /> Show Instructions
                    </div>
                  </a>
                  <div id="collapse1" className="panel-collapse collapse">
                    <hr />
                    <div className="panel-body">
                      <div id="instructions">{this.state.text[this.state.selectedCategory]}</div>
                    </div>
                  </div>
                </div>
              </div>}
              <div className="panel-group" id="accordion">
                <div className="panel panel-default">
                <a data-toggle="collapse" data-parent="#accordion"
                      href="#collapse2">
                  <div className="footer stats">
                    <i className="glyphicon btn-glyphicon glyphicon-chevron-down img-circle text-info" /> Show Video
                  </div>
                </a>
                  <div id="collapse2"
                    className="panel-collapse collapse videopadding">
                    <div className="panel-body">
                      <iframe id="video" width="720" height="350"
                        src={this.state.videos[this.state.selectedCategory]}
                        frameBorder="0" allowFullScreen></iframe>

                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
      </div>
    </div>
    )
	}
}

export default CreateTest;

import React from "react";
import { connect } from "react-redux";
import * as firebase from "firebase";
import { login, logout, resetNext, fetchUserProfile } from "../actions/auth";
import { fetchForm, updateStats, saveQuestions } from "../actions/form";
import { push } from "react-router-redux";

//component
import Sidebar from "./shared/Sidebar";
// import Navbar from "./shared/Navbar";
import PeqQuestions from "./shared/PeqQuestions";
import moment from "moment";

class App extends React.Component {
  state = {
    loaded: false,
    authenticated: false
  };

  styles = {
    app: {
      fontFamily: [
        "HelveticaNeue-Light",
        "Helvetica Neue Light",
        "Helvetica Neue",
        "Helvetica",
        "Arial",
        "Lucida Grande",
        "sans-serif"
      ],
      fontWeight: 300
    },
    row: {
      padding: 20
    }
  };

  componentDidMount() {
    localStorage.setItem("questions", JSON.stringify(PeqQuestions));
    this.checkAuthentication();
  }

  checkAuthentication() {
    firebase.auth().onAuthStateChanged(user => {
      if (user) {
        this.setState({
          authenticated: true
        });
        firebase
          .database()
          .ref()
          .child(`users/${user.uid}`)
          .on("value", snapshot => {
            this.props.fetchUserProfile(snapshot.val());
          });
        this.props.onLogin(user);
        this.props.onRedirect(this.props.next || "/dashboard");
        this.props.onResetNext();
        firebase.database().ref("/forms").on("value", snapshot => {
          const allForms = snapshot.val();
          let totalTests = 0;
          let totalUserTests = 0;
          Object.keys(allForms).forEach(userId => {
            Object.keys(allForms[userId]).forEach(formId => {
              if (allForms[userId][formId]["tests"]) {
                Object.keys(
                  allForms[userId][formId]["tests"]
                ).forEach(category => {
                  Object.keys(
                    allForms[userId][formId]["tests"][category]
                  ).forEach(test => {
                    let testdate =
                      allForms[userId][formId]["tests"][category][test].date;
                    let formattedDate = moment(testdate, "YYYY-M-D").format(
                      "YYYY-M-D"
                    );
                    let startOfMonth = moment()
                      .startOf("month")
                      .format("YYYY-M-D");
                    let endOfMonth = moment().endOf("month").format("YYYY-M-D");
                    if (
                      formattedDate > startOfMonth &&
                      formattedDate < endOfMonth
                    ) {
                      if (userId === user.uid) {
                        totalUserTests += 1;
                      }
                      totalTests += 1;
                    }
                  });
                });
              }
            });
          });
          this.props.updateStats(totalUserTests, totalTests);
          this.props.fetchUserForm(allForms[user.uid]);
          this.props.saveQuestions(
            JSON.parse(localStorage.getItem("questions"))
          );
        });
      } else {
        if (this.props.user) {
          this.props.onRedirect("/");
          this.props.onResetNext();
        } else {
          this.props.onLogout();
        }
        this.setState({
          authenticated: false
        });
      }
      if (!this.state.loaded) {
        this.setState({ loaded: true });
      }
    });
  }

  render() {
    const view1 = (
      <div className="wrapper" style={this.styles.app}>
        <Sidebar profile={this.props.profile} stats={this.props.stats} />
        <div className="main-panel" id="main-panel">
         {/* <Navbar />  */}
          {this.state.loaded ? this.props.children : <div id="loader" />}
        </div>
      </div>
    );
    return (
      <div>
        {this.state.authenticated
          ? view1
          : <div>
              {this.state.loaded ? this.props.children : <div id="loader" />}
            </div>}
      </div>
    );
  }
}

export default connect(
  state => ({
    next: state.auth.next,
    user: state.auth.user,
    profile: state.auth.profile,
    stats: state.form.stats
  }),
  dispatch => ({
    onLogin: user => {
      dispatch(login(user));
    },
    fetchUserProfile: user => {
      dispatch(fetchUserProfile(user));
    },
    onLogout: () => {
      dispatch(logout());
    },
    onRedirect: path => {
      dispatch(push(path));
    },
    onResetNext: () => {
      dispatch(resetNext());
    },
    fetchUserForm: forms => {
      dispatch(fetchForm(forms));
    },
    saveQuestions: questions => {
      dispatch(saveQuestions(questions));
    },
    updateStats: (totalUserTests, totalTests) => {
      dispatch(updateStats(totalUserTests, totalTests));
    }
  })
)(App);

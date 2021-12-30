const WAIT_TO_SEND_NOTIF_TO_FOLLOWERS_TIME = 60000;
const MIN_NUMBER_OF_ARTICLES = 5;

class MagazineStatus {
  constructor(stateName, nextState) {
    this.stateName = stateName;
    this.NextState = nextState;
  }
}

class ReadyForPushNotification extends MagazineStatus {
  constructor() {
    super('readyForPushNotification', ReadyForApprove);
  }
  publish(employee) {
    console.log(`Hello ${employee.name}. You can't publish. We are creating publications now.`);
  }
  approve(employee) {
    console.log(`Hello ${employee.name}. You can't approve. We don't have enough of publications.`);
  }
}

class ReadyForApprove extends MagazineStatus {
  constructor() {
    super('readyForApprove', ReadyForPublish);
  }
  publish(employee) {
    console.log(`Hello ${employee.name} You can't publish. We don't have a manager's approval.`);
  }
  approve(employee, magazine) {
    if (employee === magazine.manager) {
      magazine.getNextStatus();
      console.log(`Hello ${employee.name}. You approved the changes. ` +
      `The magazine switched to the ${magazine.state.stateName} status`);
    } else {
      console.log(`Hello ${employee.name}. You can't approve. Only the manager can.`);
    }
  }
}

class ReadyForPublish extends MagazineStatus {
  constructor() {
    super('readyForPublish', PublishInProgress);
  }
  publish(employee, magazine) {
    magazine.getNextStatus();
    console.log(`Hello ${employee.name} You've recently published publications. ` +
    `The magazine switched to the ${magazine.state.stateName} status`);
  }
  approve(employee) {
    console.log(`Hello ${employee.name} Publications have been already approved by you.`);
  }
}

class PublishInProgress extends MagazineStatus {
  constructor() {
    super('publishInProgress', PublishInProgress);
  }
  publish(employee) {
    console.log(`Hello ${employee.name}. While we are publishing we can't do any actions`);
  }
  approve(employee) {
    console.log(`Hello ${employee.name}. While we are publishing we can't do any actions`);
  }
}

class Magazine {
  constructor() {
    this.state = new ReadyForPushNotification();
    this.staff = [];
    this.articles = [];
    this.followers = [];
    this.manager = null;
  }
  
  addStaff(employee) {
    this.staff.push(employee);
  }
  
  addArticle(text, employee) {
    if (employee.role !== 'manager' && this.state.stateName === 'readyForPushNotification') {
      this.articles.push({
        topic: employee.role,
        text: text
      });
      
      if (this.articles.length >= MIN_NUMBER_OF_ARTICLES && this.manager) {
        this.getNextStatus();
        console.log(`The magazine switched to the ${this.state.stateName} status`);
      }
    }
  }
  
  addFollower(follower, topic) {
    this.followers.push({
      follower: follower,
      topic: topic
    })
  }
  
  removeFollower(follower, topic) {
    let foundLog = false;
    this.followers.forEach((item, index) => {
      if (item.follower === follower && item.topic === topic) {
        this.followers.splice(index, 1);
        foundLog = true;
      }
    })
    return foundLog;
  }
  
  getNextStatus() {
    this.state = new this.state.NextState();
    
    if (this.state.stateName === 'publishInProgress') {
      setTimeout(() => {
        this.state = new ReadyForPushNotification();
        this.staff = [];
        this.articles = [];
        this.followers = [];
        this.manager = null;
      }, WAIT_TO_SEND_NOTIF_TO_FOLLOWERS_TIME)
      
      this.sendNotificationsToFollowers();
    }
  }
  
  sendNotificationsToFollowers() {
    this.followers.forEach(item => {
      item.follower.onUpdate(this.getAllArticles(item.topic));
    })
  }
  
  getAllArticles(topic) {
    return this.articles.reduce((articles, item) => {
      if (item.topic === topic) {
        return articles + ' ' + item.text
      }
      return articles + '';
    }, '')
  }
}

class MagazineEmployee {
  constructor(name, role, magazine) {
    this.name = name;
    this.role = role;
    this.magazine = magazine;
    this.magazine.addStaff(this);
    if (this.role === 'manager') {
      this.magazine.manager = this;
    }
  }
  
  addArticle(text) {
    this.magazine.addArticle(text, this);
  }
  
  publish() {
    this.magazine.state.publish(this, this.magazine);
  }
  
  approve() {
    this.magazine.state.approve(this, this.magazine);
  }
}

class Follower {
  constructor(name) {
    this.name = name;
  }
  
  subscribeTo(magazine, topic) {
    this.magazine = magazine;
    magazine.addFollower(this, topic);
  }
  
  unsubscribe(topic) {
    if (this.magazine.removeFollower(this, topic)) {
      console.log(`Hey ${this.name}, you were unsubscribe from topic ${topic}`);
    } else {
      console.log(`Hey ${this.name}, you were not even subscribed to the topic ${topic} in the first place`);
    }
  }
  
  onUpdate(data) {
    if (data) {
      console.log(`${data} - for subscriber ${this.name}`);
    }
  }
}
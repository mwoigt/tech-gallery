module.exports = function ($rootScope, $stateParams, $sce, $document, $interval, ProjectService, AppService, TechnologyService, $uibModal, Analytics) {

  /**
   * Object context
   * @type {Object}
   */
   var context = this;

  /**
   * Loading state
   * @type {Boolean}
   */
   this.loading = true;

  /**
   * Technology details
   * @type {Object}
   */
   this.item = {};

  // Load techonlogy based on URL param
  TechnologyService.getTechnology($stateParams.id).then(function (technology) {
    if (technology.hasOwnProperty('error')) {
      context.showContent = false;
      context.showTechNotExists = true;
      return;
    }
    AppService.setPageTitle(technology.name);
    context.item = technology;
    context.loading = false;
    loadComments();
  });

  this.ratings = TechnologyService.getRatings();

  this.getRating = function (rating){
    return TechnologyService.getRating(rating);
  }

  this.rating = {};

  this.oldRating = {};

  this.projects = ProjectService.getProjects();

  this.getProject = function (project){
    return TechnologyService.getProject(project);
  }

  this.project = {};


  // Load techonlogy based on URL param
  TechnologyService.getUserSkill($stateParams.id).then(function (rating) {
    context.rating = rating;
    context.oldRating = rating;
  });

  this.setSkill = function (technology, newRating) {

       if (newRating !== context.oldRating) {
          TechnologyService.updateUserSkill($stateParams.id, newRating).then(function(rating){
             context.rating = rating;
             context.oldRating = rating;
          });
       } else {
          if(confirm('Deseja remover a avaliação atual?')) {
            TechnologyService.deleteUserSkill($stateParams.id).then(function(data){
              if(!data.hasOwnProperty('error')){
                context.rating = undefined;
                context.oldRating = undefined;
              }
            });
          }
       }
       Analytics.sendSkillEvent(context.item.name, newRating);
  }

  this.recommended = TechnologyService.getRecommended();

  this.setRecommendation = function (recommendation) {
    context.recommended = recommendation;
    document.getElementById('recommendation-comment-input').focus();
  }

  /* Board */
  this.boardLoaded = false;

  this.showBoard = function() {
    return !!context.item.idBoard;
  };

  this.getBoardUrl = function() {
    return $sce.trustAsResourceUrl(context.item.boardUrlPrefix + context.item.idBoard);
  };

  this.onLoadBoard = function() {
    context.boardLoaded = true;
  }

  // @todo Move this to UserService
  this.share = {
    gplus : true
  }

  this.getUsersList = function(value) {
    return TechnologyService.getUsersList(value);
  };

  /**
   * Begin of show comments features
   */
  function loadComments() {
    var req = {technologyId: $stateParams.id};
    TechnologyService.getCommentsByTech($stateParams.id).then(function(data){
      context.techComments = [];
      context.techCommentsRecommend = [];
      if(!data.hasOwnProperty('error') && data.comments !== undefined){
        for (var i = 0; i < data.comments.length; i++) {
          if(data.comments[i].recommendationScore == undefined){
            context.techComments.push(data.comments[i]);
          }else{
            context.techCommentsRecommend.push(data.comments[i]);
          }
        };
      }
    });
  }

      /**
   * Begin of show links features
   */
  function loadLinks() {
    var req = {technologyId: $stateParams.id};
    TechnologyService.getCommentsByTech($stateParams.id).then(function(data){
      context.techComments = [];
      context.techCommentsRecommend = [];
      if(!data.hasOwnProperty('error') && data.comments !== undefined){
        for (var i = 0; i < data.comments.length; i++) {
          if(data.comments[i].recommendationScore == undefined){
            context.techComments.push(data.comments[i]);
          }else{
            context.techCommentsRecommend.push(data.comments[i]);
          }
        };
      }
    });
  }

  this.addRecommendationComment = function(){
    if(context.commentRecommend && context.commentRecommend.trim().length <= 500){
      TechnologyService.addRecommendationComment(context, $stateParams.id).then(function(){
        context.commentRecommend = '';
        Analytics.sendRecommendationEvent(context.item.name, context.recommended);
        context.recommended = true;
        loadComments();
        document.getElementById('idFollowButton').className = 'btn btn-xs btn-danger';
        AppService.setAlertBotton('Recomendação incluída com sucesso.', 'success');
      });
    }else{
      AppService.setAlertBotton('Você deve informar um comentário sobre sua recomendação.', 'warning');
    }
  }

  this.addComment = function(){
    if(context.comment && context.comment.trim().length <= 500){
      TechnologyService.addComment(context, $stateParams.id).then(function(){
    	Analytics.sendCommentEvent(context.item.name);
    	context.comment = '';
        loadComments();
       document.getElementById('idFollowButton').className = 'btn btn-xs btn-danger';
        AppService.setAlertBotton('Comentário incluído com sucesso.', 'success');
      });
    }
  }

  this.showAllEndorsers = function(endorsers) {
    return (endorsers !== undefined && endorsers.length > 0);
  };

  this.getEndorsementsByTech = function() {
    TechnologyService.getEndorsementsByTech($stateParams.id).then(function(data){
      if(data){
        context.completeEndorsements = data;
        context.filteredEndorsements = data.slice(0,5);
        context.showEndorsementResponse = context.filteredEndorsements;
      }else{
        context.completeEndorsements = undefined;
        context.filteredEndorsements = undefined;
        context.showEndorsementResponse = undefined;
      }
    });
  };

  this.getEndorsementsByTech();

  this.getLinksByTech = function() {
    TechnologyService.getLinksByTech($stateParams.id).then(function(data){
      if(data){
        context.techLinks = data.links;
      }
    });
  };

  this.getLinksByTech();

  this.verifyStyle = function(endorsers){
    for(var i in endorsers){
      if(endorsers[i].email == $rootScope.userEmail){
        return true;
      }
    }
    return false;
  };

  this.showAllEndorsements = function(){
    context.showEndorsementResponse = context.completeEndorsements;
  };

  this.showAllLinks = function(){
    context.showLinkResponse = context.completeLinks;
  };

  this.showResumedEndorsements = function(){
    context.showEndorsementResponse = context.filteredEndorsements;
  };

  this.endorseUser = function() {
    TechnologyService.endorseUser($stateParams.id, this.endorsed.email).then(function(data){
      if(!data.hasOwnProperty('error')){
        Analytics.sendEndorsementEvent(context.item.name, context.endorsed.email);
        context.getEndorsementsByTech();
        AppService.setAlert('Usuário indicado!' ,'success');
      } else {
        AppService.setAlert(data.error.message ,'error');
      }
    });
  };

  this.addLink = function(){

    var self = this;

    TechnologyService.addLink($stateParams.id, this.description, this.link).then(function(data){
        if(!data.hasOwnProperty('error')){
          Analytics.sendLinkEvent(context.item.name);
          context.getLinksByTech();
          AppService.setAlert('Link incluído com sucesso!' ,'success');
          self.description = '';
          self.link = '';
        } else{
          AppService.setAlert(data.error.message ,'error');
        }
      });
  };

  this.deleteLink = function(idLink){
    var self = this;

    if(confirm('Você realmente quer apagar este link?')) {
      TechnologyService.deleteLink(idLink).then(function(data){
        if(!data.hasOwnProperty('error')){
          self.getLinksByTech();
        }
      });
    }
  };

  this.showSelfInformations = function(email){
    if($rootScope.userEmail == email){
      return true;
    }
    return false;
  };

  this.generateId = function(index, email) {
    return 'plusOne' + index + email;
  };

  this.followTechnology = function(){
    TechnologyService.followTechnology($stateParams.id).then(function(data){
        if(!data.hasOwnProperty('error')){
        changeFollowedClass(context.currentElement);
        }
      });
   }

  function changeFollowedClass(){
    var element = document.getElementById('idFollowButton');
    if(element.className.indexOf('btn-default') > 0){
      element.className = 'btn btn-xs btn-danger';
    }else{
      element.className = 'btn btn-xs btn-default';
    }
  }

  this.setFollowedClass = function(isFollowedByUser){
    if(isFollowedByUser){
      return 'btn btn-xs btn-danger';
    }
    return 'btn btn-xs btn-default';
  }

    this.addEndorse = function($event, endorsed, id){
      var elemment = $event.currentTarget;
      elemment.disabled = true;
      TechnologyService.addEndorse(endorsed, id, $stateParams.id).then(function(data){
        if(!data.hasOwnProperty('error')){
          context.getEndorsementsByTech();
          elemment.disabled = false;
        }
      });
    }

  this.open = function(endorsers, size) {
    var modalInstance = $uibModal.open({
      animation : true,
      templateUrl : 'showEndorsementModal.html',
      controller : function ($scope) {
        $scope.endorsers = endorsers;
        $scope.close = $scope.$close;
        $scope.getUserLogin = context.getUserLogin;
      },
      size : size,
      resolve : {
        endorsers : function() {
          return endorsers;
        }
      }
    });
  };

  this.getUserLogin = function (email){
    var completeEmail = email;
    completeEmail = completeEmail.split('@');
    return completeEmail[0];
  };

}

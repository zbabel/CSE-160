class Camera {
    constructor(aspectRatio, near, far){
      this.fov = 60;
      this.eye = new Vector3([0, 1.5, -18]);
      this.up = new Vector3([0, 1, 0]);
      this.yaw = 0;
      this.speed = 0.35;

      this.direction = new Vector3([0, 0, 1]);
      this.right = new Vector3([1, 0, 0]);
      this.updateDirection();

      this.viewMatrix = new Matrix4();
      this.updateView();

      this.projectionMatrix = new Matrix4();
      this.projectionMatrix.setPerspective(this.fov, aspectRatio, near, far);
    }

    updateDirection(){
      let yawCos = Math.cos(this.yaw);
      let yawSin = Math.sin(this.yaw);
      this.direction.elements[0] = yawSin;
      this.direction.elements[1] = 0;
      this.direction.elements[2] = yawCos;
      this.right.elements[0] = yawCos;
      this.right.elements[1] = 0;
      this.right.elements[2] = -yawSin;
    }

    moveForward(){
      this.eye.elements[0] += this.direction.elements[0] * this.speed;
      this.eye.elements[2] += this.direction.elements[2] * this.speed;
      this.updateView();
    }

    moveBackwards(){
      this.eye.elements[0] -= this.direction.elements[0] * this.speed;
      this.eye.elements[2] -= this.direction.elements[2] * this.speed;
      this.updateView();
    }

    moveLeft(){
      this.eye.elements[0] -= this.right.elements[0] * this.speed;
      this.eye.elements[2] -= this.right.elements[2] * this.speed;
      this.updateView();
    }

    moveRight(){
      this.eye.elements[0] += this.right.elements[0] * this.speed;
      this.eye.elements[2] += this.right.elements[2] * this.speed;
      this.updateView();
    }

    panLeft(amountDegrees = 4){
      this.yaw -= amountDegrees * Math.PI / 180;
      this.updateDirection();
      this.updateView();
    }

    panRight(amountDegrees = 4){
      this.yaw += amountDegrees * Math.PI / 180;
      this.updateDirection();
      this.updateView();
    }

    updateView(){
      let centerX = this.eye.elements[0] + this.direction.elements[0];
      let centerY = this.eye.elements[1] + this.direction.elements[1];
      let centerZ = this.eye.elements[2] + this.direction.elements[2];
      this.viewMatrix.setLookAt(
        this.eye.elements[0], this.eye.elements[1], this.eye.elements[2],
        centerX, centerY, centerZ,
        this.up.elements[0], this.up.elements[1], this.up.elements[2]
      );
    }
}

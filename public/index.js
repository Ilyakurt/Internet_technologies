document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});

class AppModel {
  static async gethrs() {
    const hrsRes = await fetch('http://localhost:4321/hrs');
    return await hrsRes.json();
  }

  static async addhr(hrName) {
    console.log(JSON.stringify({ hrName }));
    const result = await fetch(
      'http://localhost:4321/hrs',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ hrName })
      }
    );

    const resultData = await result.json();

    return result.status === 200
      ? resultData
      : Promise.reject(resultData);
  }

  static async addvacancy({
    hrId,
    vacancyName,
    vacancyCompany
  }) {
    const result = await fetch(
      `http://localhost:4321/hrs/${hrId}/vacancys`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ vacancyName, vacancyCompany })
      }
    );

    const resultData = await result.json();

    return result.status === 200
      ? resultData
      : Promise.reject(resultData);
  }

  static async editvacancy({
    hrId,
    vacancyId,
    newvacancyName,
    newvacancyCompany
  }) {
    const result = await fetch(
      `http://localhost:4321/hrs/${hrId}/vacancys/${vacancyId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ newvacancyName, newvacancyCompany })
      }
    );

    const resultData = await result.json();

    return result.status === 200
      ? resultData
      : Promise.reject(resultData);
  }

  static async deletevacancy({
    hrId,
    vacancyId
  }) {
    const result = await fetch(
      `http://localhost:4321/hrs/${hrId}/vacancys/${vacancyId}`,
      {
        method: 'DELETE'
      }
    );

    const resultData = await result.json();

    return result.status === 200
      ? resultData
      : Promise.reject(resultData);
  }

  static async movevacancy({
    fromhrId,
    tohrId,
    vacancyId
  }) {
    const result = await fetch(
      `http://localhost:4321/hrs/${fromhrId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tohrId, vacancyId })
      }
    );

    const resultData = await result.json();

    return result.status === 200
      ? resultData
      : Promise.reject(resultData);
  }
}

class App {
  constructor() {
    this.hrs = [];
  }

  onEscapeKeydown = ({ key }) => {
    if (key === 'Escape') {
      const input = document.getElementById('add-hr-input');
      input.style.display = 'none';
      input.value = '';

      document.getElementById('hw-hr-add-hr')
        .style.display = 'inherit';
    }
  };

  onInputKeydown = async ({ key, target }) => {
    if (key === 'Enter') {
      if (target.value) {
        await AppModel.addhr(target.value);

        this.hrs.push(
          new hr({
            tlName: target.value,
            tlID: `TL${this.hrs.length}`,
            movevacancy: this.movevacancy
          })
        );

        this.hrs[this.hrs.length - 1].render();
      }
      
      target.style.display = 'none';
      target.value = '';

      document.getElementById('hw-hr-add-hr')
        .style.display = 'inherit';
    }
  };

  movevacancy = async ({ vacancyID, direction }) => {
    let [
      tlIndex,
      vacancyIndex
    ] = vacancyID.split('-T');
    tlIndex = Number(tlIndex.split('TL')[1]);
    vacancyIndex = Number(vacancyIndex);
    const vacancy = { vacancyName: this.hrs[tlIndex].vacancys[vacancyIndex].vacancyName,
      vacancyCompany: this.hrs[tlIndex].vacancys[vacancyIndex].vacancyCompany
    };
    const targetTlIndex = direction === 'left'
      ? tlIndex - 1
      : tlIndex + 1;

    try {
      await AppModel.movevacancy({
        fromhrId: tlIndex,
        tohrId: targetTlIndex,
        vacancyId: vacancyIndex
      });

      this.hrs[tlIndex].deletevacancy(vacancyIndex);
      this.hrs[targetTlIndex].addvacancy(vacancy.vacancyName,vacancy.vacancyCompany);
    } catch (error) {
      console.error('ERROR', error);
    }
  };

  async init() {
    const hrs = await AppModel.gethrs();
    hrs.forEach(({ hrName, vacancys }) => {
      const newhr = new hr({
        tlName: hrName,
        tlID: `TL${this.hrs.length}`,
        movevacancy: this.movevacancy
      });
      vacancys.forEach(vacancy => newhr.vacancys.push(vacancy));
      
      this.hrs.push(newhr);
      newhr.render();
      newhr.rerendervacancys();
    });

    document.getElementById('hw-hr-add-hr')
      .addEventListener(
        'click',
        (event) => {
          event.target.style.display = 'none';

          const input = document.getElementById('add-hr-input');
          input.style.display = 'inherit';
          input.focus();
        }
      );

    document.addEventListener('keydown', this.onEscapeKeydown);

    document.getElementById('add-hr-input')
      .addEventListener('keydown', this.onInputKeydown);

    document.querySelector('.toggle-switch input')
      .addEventListener(
        'change',
        ({ target: { checked } }) => {
          checked
            ? document.body.classList.add('dark-theme')
            : document.body.classList.remove('dark-theme');
        }
      );
  }
}

class hr {
  constructor({
    tlName,
    tlID,
    movevacancy
  }) {
    this.tlName = tlName;
    this.tlID = tlID;
    this.vacancys = [];
    this.movevacancy = movevacancy;
  }

  onAddvacancyButtonClick = async () => {
    const newvacancyName = prompt('👨‍💻 Введите название вакнсии:');
    const newvacancyCompany = prompt('🏦 Введите название компании:');

    if (!newvacancyName && !newvacancyCompany) return;

    const hrId = Number(this.tlID.split('TL')[1]);
    try {
      await AppModel.addvacancy({
        hrId,
        vacancyName: newvacancyName,
        vacancyCompany: newvacancyCompany
      });
      this.addvacancy(newvacancyName, newvacancyCompany);
    } catch (error) {
      console.error('ERROR', error);
    }
  };

  addvacancy = (vacancyName, vacancyCompany) => {
    const vacancy = {
      vacancyName: vacancyName,
      vacancyCompany: vacancyCompany,
    };

    console.log(vacancy);

    document.querySelector(`#${this.tlID} ul`)
      .appendChild(
        this.rendervacancy(
          `${this.tlID}-T${this.vacancys.length}`,
          vacancy
        )
      );

    this.vacancys.push({vacancyName, vacancyCompany});
  };

  onEditvacancy = async (vacancyID) => {
    const vacancyIndex = Number(vacancyID.split('-T')[1]);
    const oldvacancy = this.vacancys[vacancyIndex];

    const newvacancyName = prompt('👨‍💻 Введите новое название вакансии', oldvacancy.vacancyName);
    const newvacancyCompany= prompt('🏦 Введите новое название компании', oldvacancy.vacancyCompany);

    if ((!newvacancyName || newvacancyName === oldvacancy.vacancyName) 
          && (!newvacancyCompany || newvacancyCompany === oldvacancy.vacancyCompany)){
      return;
    }

    const hrId = Number(this.tlID.split('TL')[1]);
    try {
      await AppModel.editvacancy({
        hrId,
        vacancyId: vacancyIndex,
        newvacancyName,
        newvacancyCompany
      });

      this.vacancys[vacancyIndex].vacancyName = newvacancyName;
      this.vacancys[vacancyIndex].vacancyCompany = newvacancyCompany;
      document.querySelector(`#${vacancyID} span`)
        .innerHTML = `👨‍💻 ${newvacancyName} <br> 🏦 ${newvacancyCompany}`;
    } catch (error) {
      console.error('ERROR', error);
    }
  };

  onDeletevacancyButtonClick = async (vacancyID) => {
    const vacancyIndex = Number(vacancyID.split('-T')[1]);
    const vacancyName = this.vacancys[vacancyIndex].vacancyName;

    if (!confirm(`👨‍💻 Вакансия '${vacancyName}' будет удалена. Продолжить?`)) return;

    const hrId = Number(this.tlID.split('TL')[1]);
    try {
      await AppModel.deletevacancy({
        hrId,
        vacancyId: vacancyIndex
      });

      this.deletevacancy(vacancyIndex);
    } catch (error) {
      console.error('ERROR', error);
    }
  };

  deletevacancy = (vacancyIndex) => {
    this.vacancys.splice(vacancyIndex, 1);
    this.rerendervacancys();
  };

  rerendervacancys = () => {
    const hr = document.querySelector(`#${this.tlID} ul`);
    hr.innerHTML = '';

    this.vacancys.forEach((vacancy, vacancyIndex) => {
      hr.appendChild(
        this.rendervacancy(
          `${this.tlID}-T${vacancyIndex}`,
          vacancy
        )
      );
    });
  };

  rendervacancy = ( vacancyID, singlevacancy) => {
    const vacancy = document.createElement('li');
    vacancy.classList.add('hw-hr-vacancy');
    vacancy.id = vacancyID;

    const span = document.createElement('span');
    span.classList.add('hw-hr-vacancy-text');
    span.innerHTML = `👨‍💻 ${singlevacancy.vacancyName} <br>  🏦 ${singlevacancy.vacancyCompany}`;
    vacancy.appendChild(span);

    const controls = document.createElement('div');
    controls.classList.add('hw-hr-vacancy-controls');

    const upperRow = document.createElement('div');
    upperRow.classList.add('hw-hr-vacancy-controls-row');

    const leftArrow = document.createElement('button');
    leftArrow.type = 'button';
    leftArrow.classList.add(
      'hw-hr-vacancy-controls-button',
      'left-arrow'
    );
    leftArrow.addEventListener(
      'click',
      () => this.movevacancy({ vacancyID, direction: 'left' })
    );
    upperRow.appendChild(leftArrow);

    const rightArrow = document.createElement('button');
    rightArrow.type = 'button';
    rightArrow.classList.add(
      'hw-hr-vacancy-controls-button',
      'right-arrow'
    );
    rightArrow.addEventListener(
      'click',
      () => this.movevacancy({ vacancyID, direction: 'right' })
    );
    upperRow.appendChild(rightArrow);

    controls.appendChild(upperRow);

    const lowerRow = document.createElement('div');
    lowerRow.classList.add('hw-hr-vacancy-controls-row');

    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.classList.add(
      'hw-hr-vacancy-controls-button',
      'edit-icon'
    );
    editButton.addEventListener('click', () => this.onEditvacancy(vacancyID));
    lowerRow.appendChild(editButton);

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.classList.add(
      'hw-hr-vacancy-controls-button',
      'delete-icon'
    );
    deleteButton.addEventListener('click', () => this.onDeletevacancyButtonClick(vacancyID));
    lowerRow.appendChild(deleteButton);

    controls.appendChild(lowerRow);

    vacancy.appendChild(controls);

    return vacancy;
  };

  render() {
    const hr = document.createElement('div');
    hr.classList.add('hw-hr');
    hr.id = this.tlID;

    const header = document.createElement('header');
    header.classList.add('hw-hr-header');
    header.innerHTML = this.tlName;
    hr.appendChild(header);

    const list = document.createElement('ul');
    list.classList.add('hw-hr-vacancys');
    hr.appendChild(list);

    const footer = document.createElement('footer');
    const button = document.createElement('button');
    button.type = 'button';
    button.classList.add('hw-hr-add-vacancy');
    button.innerHTML = '👨‍💻 Добавить вакансию';
    button.addEventListener('click', this.onAddvacancyButtonClick);
    footer.appendChild(button);
    hr.appendChild(footer);

    const container = document.querySelector('main');
    container.insertBefore(hr, container.lastElementChild);
  }
}

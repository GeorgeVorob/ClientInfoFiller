using ClientInfoFiller.Models;
using ClientInfoFiller.Services;
using ReactiveUI;
using System.Collections.ObjectModel;
using System.IO;
using System;

namespace ClientInfoFIllerFinal.ViewModels
{
    public class MainWindowViewModel : ViewModelBase
    {
        private string _currentFilePath = "";
        public string CurrentFilePath
        {
            get => _currentFilePath;
            set
            {
                this.RaiseAndSetIfChanged(ref _currentFilePath, value);
                CanAccessFile = !String.IsNullOrEmpty(CurrentFilePath);
            }
        }

        private bool _canAccesFile;
        public bool CanAccessFile
        {
            get => _canAccesFile;
            set => this.RaiseAndSetIfChanged(ref _canAccesFile, value);
        }

        private Row _currentRow;
        public Row CurrentRow
        {
            get => _currentRow;
            set
            {
                if (value == null)
                {
                    // dude why
                    return;
                }
                _currentRow = value;
                UpdateFields();
            }
        }

        public string FormPrice
        {
            set
            {
                int safeVal = !String.IsNullOrEmpty(value) ? Int32.Parse(value) : 0;
                CurrentRow.Price = safeVal;
                UpdateFields();
            }

            get
            {
                if (CurrentRow.Price == 0) return "";
                return CurrentRow.Price.ToString();
            }
        }

        public string FormPrepayment
        {
            set
            {
                int safeVal = !String.IsNullOrEmpty(value) ? Int32.Parse(value) : 0;
                CurrentRow.Prepayment = safeVal;
                UpdateFields();
            }

            get
            {
                if (CurrentRow.Prepayment == 0) return "";
                return CurrentRow.Prepayment.ToString();
            }
        }

        public string FormPledge
        {
            set
            {
                int safeVal = !String.IsNullOrEmpty(value) ? Int32.Parse(value) : 0;
                CurrentRow.Pledge = safeVal;
                UpdateFields();
            }

            get
            {
                if (CurrentRow.Pledge == 0) return "";
                return CurrentRow.Pledge.ToString();
            }
        }

        public int FormOwe => CurrentRow.Owe;
        public ObservableCollection<string> searchModesComboBoxData { get; } = new();

        private string _selectedSearchMode;
        public string SelectedSearchMode
        {
            get => _selectedSearchMode;
            set => this.RaiseAndSetIfChanged(ref _selectedSearchMode, value);
        }

        private string _searchValue = "";
        public string SearchValue
        {
            get => _searchValue;
            set => this.RaiseAndSetIfChanged(ref _searchValue, value);
        }

        public ObservableCollection<Row> FoundRows { get; } = new();

        public bool IsNewRow => CurrentRow.RowPos == -1;

        public MainWindowViewModel()
        {
            _currentRow = new Row();
            searchModesComboBoxData.Add("По номеру записи");
            searchModesComboBoxData.Add("По ФИО");
            searchModesComboBoxData.Add("По номеру телефона");
            searchModesComboBoxData.Add("По костюму");
            _selectedSearchMode = searchModesComboBoxData[0];


            UpdateFields();
        }
        public void OnRowSaveClick()
        {
            if (CurrentFilePath == null) throw new Exception("Пожалуйста, укажите путь к файлу таблицы.");

            ExcelService excel = new ExcelService(new FileInfo(CurrentFilePath));
            WordService word = new WordService();

            bool isRowNew = CurrentRow.RowPos == -1;
            excel.SaveRow(this.CurrentRow);
            if (isRowNew)
            {
                word.FillAndPrint(this.CurrentRow);
                this.CurrentRow = new Row();
            }

            UpdateFields();
        }

        public void OnSearchClick()
        {
            if (CurrentFilePath == null) throw new Exception("Пожалуйста, укажите путь к файлу таблицы.");


            ExcelService excel = new ExcelService(new FileInfo(CurrentFilePath));
            FoundRows.Clear();
            SearchModes searchMode = SearchModes.ByID;

            switch (SelectedSearchMode)
            {
                case "По номеру записи": searchMode = SearchModes.ByID; break;
                case "По ФИО": searchMode = SearchModes.ByCustomerName; break;
                case "По номеру телефона": searchMode = SearchModes.ByProhe; break;
                case "По костюму": searchMode = SearchModes.ByCostumeName; break;
            }

            foreach (Row row in excel.SearchRow(searchMode, SearchValue, 10))
            {
                FoundRows.Add(row);
            }

        }

        public void ResetCurrentRow() => CurrentRow = new Row();

        public void UpdateFields()
        {
            this.RaisePropertyChanged(nameof(CurrentRow));
            this.RaisePropertyChanged();
            this.RaisePropertyChanged("");
            this.RaisePropertyChanged(nameof(IsNewRow));
            this.RaisePropertyChanged("IsNewRow");
            this.RaisePropertyChanged(nameof(SelectedSearchMode));
            this.RaisePropertyChanged(nameof(FoundRows));
            this.RaisePropertyChanged(nameof(FormOwe));
        }
    }
}
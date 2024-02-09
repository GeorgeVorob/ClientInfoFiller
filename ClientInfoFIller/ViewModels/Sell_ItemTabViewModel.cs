using ClientInfoFiller.Models;
using ClientInfoFiller.Services;
using ReactiveUI;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ClientInfoFiller.ViewModels
{
    public class Sell_ItemTabViewModel : ViewModelBase
    {
        #region Constructors
        public Sell_ItemTabViewModel()
        {
            _currentRow = new Row();

            if (!File.Exists(ExcelSelledFilepath))
            {
                ExcelSelledFilepath = "";
            }

            UpdateFields();
        }
        #endregion

        #region Properties
        public bool CanAccessExcellSelledFile => File.Exists(ExcelSelledFilepath);
        public string ExcelSelledFilepath
        {
            // TODO: проклято-ли это?
            get => ConfigInfo.Instance.ExcelToStoreSelledFilepath;
            set
            {
                ConfigInfo.Instance.ExcelToStoreSelledFilepath = value;

                UpdateFields();
            }
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

        public string FormPrepaymentCash
        {
            set
            {
                int safeVal = !String.IsNullOrEmpty(value) ? Int32.Parse(value) : 0;
                CurrentRow.PrepaymentCash = safeVal;
                UpdateFields();
            }

            get
            {
                if (CurrentRow.PrepaymentCash == 0) return "";
                return CurrentRow.PrepaymentCash.ToString();
            }
        }

        public string FormPrepaymentDigital
        {
            set
            {
                int safeVal = !String.IsNullOrEmpty(value) ? Int32.Parse(value) : 0;
                CurrentRow.PrepaymentDigital = safeVal;
                UpdateFields();
            }

            get
            {
                if (CurrentRow.PrepaymentDigital == 0) return "";
                return CurrentRow.PrepaymentDigital.ToString();
            }
        }
        #endregion

        #region Methods
        public void OnSellClick()
        {
            if (ExcelSelledFilepath == null) throw new Exception("Пожалуйста, укажите путь к файлу таблицы.");

            ExcelService excel = new ExcelService(new FileInfo(ExcelSelledFilepath));

            excel.SaveSellRow(this.CurrentRow);

            this.CurrentRow = new Row();
            UpdateFields();
        }

        public void UpdateFields()
        {
            this.RaisePropertyChanged(nameof(CurrentRow));
            this.RaisePropertyChanged();
            this.RaisePropertyChanged("");
            this.RaisePropertyChanged(nameof(ExcelSelledFilepath));
            this.RaisePropertyChanged(nameof(CanAccessExcellSelledFile));
        }
        #endregion
    }
}

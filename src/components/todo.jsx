import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../css/todo.css';
import '../css/main.css';
import { FaRegTrashAlt } from "react-icons/fa";
import { FaSquareCheck } from "react-icons/fa6";


import axios from 'axios';
import { useState, useEffect, useRef } from "react";




function Todo() {
    // todos state'ini tanımlayın
    const [todos, setTodos] = useState([]); // Başlangıçta boş bir dizi
    const [input, setInput] = useState("");  // input state'ini oluşturun
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredTodos, setFilteredTodos] = useState([]); // Filtrelenmiş görevler için state
    const [checked, setChecked] = useState();
    const listRef = useRef(null); // Ref oluşturduk

    useEffect(() => {
        if (searchTerm === '') {
            setFilteredTodos(todos); // No filter applied
        } else {
            const filtered = todos.filter(todo => todo.gorevAdi.toLowerCase().includes(searchTerm.toLowerCase()));
            setFilteredTodos(filtered); // Apply filter
        }
    }, [searchTerm, todos]);


    // Arama ve input değeri değiştiğinde güncelleme
    const handleInputChange = (event) => {
        setInput(event.target.value);
    };


    // Görevleri yüklemek için useEffect
    useEffect(() => {
        fetchTodos();
    }, []);

    // Görevleri PHP'den çek
    const fetchTodos = async () => {
        try {
            const response = await fetch("http://localhost/fatodo/fatodo.php", {
                method: "GET",
                headers: { "Content-Type": "application/json" },
            });

            if (!response.ok) {
                throw new Error("Bir hata oluştu: " + response.status);
            }

            const data = await response.json();
            setTodos(data); // Gelen görevleri state'e aktar
        } catch (error) {
            console.error(error);
        }
    };


    // Yeni görev ekle

    const addTodo = async (event) => {
        // Input değerini kontrol et
        console.log("Input değeri: ", input); // Input değerini kontrol et
        event.preventDefault(); // Prevent form from reloading the page
        if (!input || !input.trim()) {
            alert("Lütfen bir görev girin.");
            return;
        }

        if (!input || !input.trim()) {
            alert("Lütfen bir görev girin.");
            return;
        }

        try {
            const response = await fetch("http://localhost/fatodo/fatodo.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ gorevAdi: input.trim(), checked: 0 }), // Input değerini gönder
            });

            if (!response.ok) {
                throw new Error("Bir hata oluştu: " + response.status);
            }

            const result = await response.json();
            console.log("Sunucudan gelen yanıt: ", result); // Yanıtı kontrol et

            // Eğer hata yoksa, görev listesine ekle
            if (result && !result.hata) {
                setTodos(result); // Tüm görevleri alıp listeyi güncelle
            } else {
                alert(result.hata || "Bir hata oluştu.");
            }

            setInput(""); // Input'u temizle
        } catch (error) {
            console.error("Görev eklerken bir hata oluştu:", error);
        }
    };




    // console.log('Todos state:', todos);
    // Görev durumunu güncelleme fonksiyonu
    // Butona tıklama olayı
    const handleClick = (todo) => {
        if (!todo || todo.id === undefined || todo.checked === undefined) {
            console.error('Geçersiz todo objesi:', todo);
            return;
        }

        console.log('Geçerli todo objesi:', todo);

        const newChecked = todo.checked === 1 ? 0 : 1; // checked durumunu tersine çevir

        // Veritabanına güncellenmiş 'checked' durumunu gönder
        toggleChecked(todo.id, newChecked);
    };

    const toggleChecked = async (id, newChecked) => {
        if (id === undefined || newChecked === undefined) {
            console.error('ID veya checked değeri undefined:', { id, newChecked });
            return;
        }

        try {
            const response = await fetch('http://localhost/fatodo/fatodo.php', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    id: id,
                    operation: 'check_item',
                    checked: newChecked,
                }),
            });

            if (!response.ok) {
                throw new Error('Ağ hatası: ' + response.status);
            }

            const data = await response.json();
            console.log('Sunucudan gelen veri:', data);

            if (data && data.success) {
                setTodos((prevTodos) =>
                    prevTodos.map((todo) =>
                        todo.id === id
                            ? { ...todo, checked: newChecked } // checked durumunu güncelle
                            : todo
                    )
                );
            } else {
                console.error('Veritabanında güncelleme hatası:', data ? data.message : 'Bilinmeyen hata');
            }
        } catch (error) {
            console.error('Görev durumunu güncellerken hata oluştu:', error);
        }
    };





    // Görev silme fonksiyonu
    const deleteTask = async (id) => {
        try {
            const response = await fetch('http://localhost/fatodo/fatodo.php', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    id,
                    operation: 'delete_onetask'
                })
            });

            if (!response.ok) {
                throw new Error(`Ağ hatası: ${response.status}`);
            }

            setTodos((prevTodos) => prevTodos.filter(todo => todo.id !== id)); // Silinen görevi çıkar
        } catch (error) {
            console.error('Görev silinirken hata oluştu:', error);
        }
    };





    // Arama terimi değiştiğinde görevleri filtrele
    useEffect(() => {
        const fetchFilteredTodos = async () => {
            if (searchTerm === '') {
                setFilteredTodos(todos); // Arama terimi boşsa tüm görevleri göster
                return;
            }

            try {
                const response = await fetch(
                    `http://localhost/fatodo/fatodo.php?searchTerm=${encodeURIComponent(searchTerm)}`,
                    {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                        },
                    }
                );

                if (!response.ok) {
                    throw new Error('Ağ hatası: ' + response.status);
                }

                const todos = await response.json();
                setFilteredTodos(todos); // Gelen görevleri filtrelenmiş olarak ayarla
            } catch (error) {
                console.error('Bir hata oluştu:', error);
            }
        };

        fetchFilteredTodos();
    }, [searchTerm, todos]); // Arama terimi ya da todos değiştiğinde çalışır

    // Arama terimi değiştiğinde güncelleme
    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value); // Arama kelimesini güncelle
    };


    // Tüm görevleri silme fonksiyonu
    const removeAll = async () => {
        if (!window.confirm("Tüm görevleri silmek istediğinize emin misiniz?")) return;

        try {
            const response = await fetch('http://localhost/fatodo/fatodo.php', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    operation: 'delete_all'
                })
            });

            if (!response.ok) {
                throw new Error(`Ağ hatası: ${response.status}`);
            }

            const result = await response.json();
            if (result.success) {
                setTodos([]); // Tüm görevleri temizle
            } else {
                console.error('Hata:', result.error);
            }
        } catch (error) {
            console.error('Tüm görevler silinirken hata oluştu:', error);
        }
    };






    // Tüm görevleri "yapıldı" olarak işaretleme fonksiyonu
    // Tüm görevleri "yapıldı" olarak işaretleme fonksiyonu
    const checkedAll = async () => {
        try {
            const response = await fetch('http://localhost/fatodo/fatodo.php', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    operation: 'check_all',
                    checked: 1
                })
            });

            if (!response.ok) {
                throw new Error(`Ağ hatası: ${response.status}`);
            }

            const updatedTodos = await response.json();

            // Güncellenmiş todos'ları state'e set et
            setTodos(updatedTodos); // Güncellenmiş listeyi durum ile eşitle

        } catch (error) {
            console.error('Tüm görevler işaretlenirken hata oluştu:', error);
        }
    };





    // Tüm görevleri sunucudan çekme fonksiyonu
    const fetchAllTodos = async () => {
        try {
            const response = await fetch('http://localhost/fatodo/fatodo.php', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            if (!response.ok) {
                throw new Error('Ağ hatası: ' + response.status);
            }

            const result = await response.json();
            setTodos(result); // Gelen görevleri duruma kaydet
        } catch (error) {
            console.error('Görevler alınırken hata oluştu:', error);
        }
    };

    // Sadece üstü çizili görevleri silme fonksiyonu
    const removeSelected = async () => {
        try {
            // Sadece 'checked' değeri 1 olan görevleri filtrele ve sil
            const tasksToDelete = todos.filter(todo => todo.checked === 1);

            if (tasksToDelete.length === 0) {
                alert('Silinecek yapılmış görev yok.');
                return;
            }

            const response = await fetch('http://localhost/fatodo/fatodo.php', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    operation: 'check_delete', // Sunucuya işlemi belirtmek için operation değeri gönderiliyor
                    ids: tasksToDelete.map(task => task.id).join(',') // Silinecek görevlerin id'lerini birleştir
                })
            });

            if (!response.ok) {
                throw new Error('Ağ hatası: ' + response.status);
            }

            const result = await response.json();

            if (result.success) {
                console.log('Yapılan görevler başarıyla silindi.');

                // Silinen görevleri todos listesinden çıkar
                const updatedTodos = todos.filter(todo => !tasksToDelete.some(task => task.id === todo.id));
                setTodos(updatedTodos); // Güncellenmiş todos listesini state'e aktar
            } else {
                console.error('Silme başarısız:', result.error);
            }
        } catch (error) {
            console.error('Görevler silinirken hata oluştu:', error);
        }
    };

    // Görev listesi oluşturma
    const renderTodos = () => {
        return todos.map(todo => (
            <li
                key={todo.id}
                id={`task-${todo.id}`}
                className="list-group-item d-flex justify-content-between"
                style={{
                    textDecoration: todo.checked === 1 ? "line-through" : "none"
                }}
            >
                {todo.gorevAdi}
                <div className="div6">
                    <button className="btn mr-2 custom-button" onClick={() => handleClick(todo)}>
                        <i className="fa-solid fa-square-check"></i>
                    </button>
                    <button className="btn mr-2 custom-button" onClick={() => deleteTask(todo.id)}>
                        <i className="fas fa-trash-alt"></i>
                    </button>
                </div>
            </li>
        ));
    };




    return (

        <div >
            <div>
                <header className="bg-dark-blue">
                    <div className="containerr">
                        <nav id="navbar">
                            <h1 id="fato">faTo<span>DoList</span></h1>



                        </nav>
                    </div>
                </header>
            </div>

            <div id="home">

                <div id="div1" className="name">
                    <div id="div2">
                        <form id="form" className="mt-5">
                            <div id="div3">
                                <div id="div4" className="col-100">
                                    <h4 style={{ color: '#D2624C' }}>todo girin:</h4>
                                    <input
                                        id="todogir"
                                        type="text"
                                        className="form-control form-control-md"
                                        placeholder="Todo giriniz"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)} // Inputu state'e bağla
                                    />
                                    {/* Todo ekleme butonu */}
                                    <button
                                        id="todoAddButton"
                                        type="submit"
                                        className="btn custom-button2 mt-3"
                                        style={{ fontSize: "12px" }}
                                        onClick={addTodo} // AddTodo fonksiyonunu çağır
                                    >
                                        Todo Ekleyin
                                    </button>
                                    <hr />


                                </div>

                                <div className="col-100" id="div5">
                                    <h4 style={{ color: "#D2624C" }}>todo listeniz:</h4>

                                    <input type="text" className="form-control form-control-md" id="todoara" value={searchTerm}
                                        onChange={handleSearchChange} placeholder="Todo arayınız" />
                                    <div id="div7" className="d-flex">
                                        <a href="#" className="btn custom-button3 mt-3 mr-3 " onClick={removeAll} style={{ fontSize: "12px" }}>Tüm Todoları Temizle</a>
                                        <a href="#" id="allChecked" className="btn custom-button3 mt-3 mr-3" onClick={checkedAll} style={{ fontSize: "12px" }}>Tüm Todolar Yapıldı</a>

                                        <a href="#" id="clearButtonChecked" className="btn custom-button3 mt-3 " onClick={removeSelected} style={{ fontSize: "12px" }}>Yapılanları Temizle</a>

                                    </div>
                                    <div className="todo-list">
                                        <ul id="ul1" className="list-group overlay-scroll">
                                            {filteredTodos.length === 0 ? (
                                                <h4 style={{ color: "white" }}>
                                                    görev yok
                                                </h4>
                                            ) : (
                                                filteredTodos.map(todo => (
                                                    <li
                                                        key={todo.id}
                                                        className={`list-group-item d-flex justify-content-between align-items-center ${todo.checked === 1 ? 'checked' : ''}`}
                                                    >
                                                        {todo.gorevAdi}
                                                        <div className="div6">
                                                            <button className="btn mr-2 custom-button" onClick={() => handleClick(todo)}>
                                                                <FaSquareCheck />
                                                            </button>
                                                            <button className="btn mr-2 custom-button" onClick={() => deleteTask(todo.id)}>
                                                                <FaRegTrashAlt />
                                                            </button>
                                                        </div>
                                                    </li>
                                                ))
                                            )}
                                        </ul>
                                    </div>







                                    <hr />
                                    <br />
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>







    )
}

export default Todo